import * as THREE from 'three'
import { pylonIncomerPaths, substationOutletPaths, yardBusPaths } from './PowerLines'

function blenderToThree(x: number, y: number, z: number) {
  return new THREE.Vector3(x, z, -y)
}

/**
 * The MV line is fed from the source substation, on the crossbeam north of
 * the yard. Spans east of that outlet are not part of the campus feed.
 */
const SUBSTATION_TAP = { x: 122, y: 336 }
const EAST_OF_SUBSTATION = 132

function distanceToTap(point: number[]) {
  const dx = point[0] - SUBSTATION_TAP.x
  const dy = point[1] - SUBSTATION_TAP.y
  return dx * dx + dy * dy
}

function pathLength(path: number[][]) {
  let length = 0
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0]
    const dy = path[i][1] - path[i - 1][1]
    const dz = path[i][2] - path[i - 1][2]
    length += Math.hypot(dx, dy, dz)
  }
  return length
}

/**
 * Pulse travels from path start to path end. Keep the end nearer the
 * substation as the start, and drop the cables that continue east of it.
 */
function feedFromSubstation(paths: number[][][]) {
  const fed: number[][][] = []
  for (const path of paths) {
    const kept = path.filter((point) => point[0] <= EAST_OF_SUBSTATION)
    if (kept.length < 2) continue

    let closest = 0
    let best = Infinity
    for (let i = 0; i < kept.length; i++) {
      const distance = distanceToTap(kept[i])
      if (distance < best) {
        best = distance
        closest = i
      }
    }

    const towardStart = kept.slice(0, closest + 1).reverse()
    const towardEnd = kept.slice(closest)
    for (const ray of [towardStart, towardEnd]) {
      if (ray.length < 2 || pathLength(ray) < 8) continue
      const end = ray[ray.length - 1]
      const start = ray[0]
      if (end[0] > start[0] + 3 && end[0] > SUBSTATION_TAP.x) continue
      fed.push(ray)
    }
  }
  return fed
}

export interface FlowPathData {
  id: string
  kind: 'fiber' | 'power'
  placement: 'underground' | 'aerial'
  paths: number[][][] // [pathIdx][ptIdx][x, y, z] in Blender coordinates
}

export interface NetworkFlowsJson {
  space: string
  flows: FlowPathData[]
  junctions?: { name: string; position: number[]; z_min: number; z_max: number }[]
}

interface FlowMeshEntry {
  id: string
  kind: 'fiber' | 'power'
  placement: 'underground' | 'aerial'
  mesh: THREE.Mesh
  material: THREE.ShaderMaterial
  targetOpacity: number
  currentOpacity: number
  suppressed: boolean
}

const FLOW_VERTEX_SHADER = /* glsl */ `
  attribute float aPathU;
  varying float vPathU;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vPathU = aPathU;
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const FLOW_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uPulseWidth;
  uniform float uPulseFreq;
  uniform float uOpacity;
  uniform float uBaseGlow;
  varying float vPathU;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    if (uOpacity <= 0.001) {
      discard;
    }

    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = 0.35 + 0.65 * pow(1.0 - abs(dot(normal, viewDir)), 1.5);

    // Pulse moving along path metric coordinate
    float phase = vPathU * uPulseFreq - uTime * uSpeed;
    float wave = fract(phase);
    float pulse = smoothstep(1.0 - uPulseWidth, 1.0, wave) * 1.8 + exp(-8.0 * (1.0 - wave)) * 0.9;

    float intensity = (uBaseGlow + pulse) * fresnel;
    vec3 col = uColor * intensity;

    gl_FragColor = vec4(col, uOpacity * clamp(intensity * 0.9, 0.0, 1.0));
  }
`

/**
 * Builds a single merged BufferGeometry for an array of 3D polyline paths.
 * Returns null if no valid paths exist.
 */
function buildMergedTubeGeometry(
  paths: THREE.Vector3[][],
  radius: number,
  radialSegments = 6,
): THREE.BufferGeometry | null {
  if (!paths.length) return null

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const pathUs: number[] = []
  const indices: number[] = []

  let vertexOffset = 0

  for (const path of paths) {
    if (path.length < 2) continue

    // Compute cumulative distances along this path
    const distances: number[] = [0]
    let totalDist = 0
    for (let i = 1; i < path.length; i++) {
      totalDist += path[i - 1].distanceTo(path[i])
      distances.push(totalDist)
    }
    if (totalDist < 0.1) continue

    // Build coordinate frames for each path point
    const pointsCount = path.length
    const tangents: THREE.Vector3[] = []
    const normalsVec: THREE.Vector3[] = []
    const binormals: THREE.Vector3[] = []

    for (let i = 0; i < pointsCount; i++) {
      const p = path[i]
      const prev = i > 0 ? path[i - 1] : p
      const next = i < pointsCount - 1 ? path[i + 1] : p
      const t = next.clone().sub(prev).normalize()
      if (t.lengthSq() < 0.0001) t.set(0, 1, 0)
      tangents.push(t)

      // Initial normal
      let n = new THREE.Vector3(0, 1, 0)
      if (Math.abs(t.dot(n)) > 0.9) {
        n = new THREE.Vector3(1, 0, 0)
      }
      const b = t.clone().cross(n).normalize()
      n = b.clone().cross(t).normalize()
      normalsVec.push(n)
      binormals.push(b)
    }

    const pathStartVertex = vertexOffset

    for (let i = 0; i < pointsCount; i++) {
      const p = path[i]
      const n = normalsVec[i]
      const b = binormals[i]
      const dist = distances[i]

      for (let j = 0; j <= radialSegments; j++) {
        const theta = (j / radialSegments) * Math.PI * 2
        const cos = Math.cos(theta)
        const sin = Math.sin(theta)

        const normal = n.clone().multiplyScalar(cos).add(b.clone().multiplyScalar(sin)).normalize()
        const pos = p.clone().add(normal.clone().multiplyScalar(radius))

        positions.push(pos.x, pos.y, pos.z)
        normals.push(normal.x, normal.y, normal.z)
        uvs.push(j / radialSegments, dist / totalDist)
        pathUs.push(dist) // metric coordinate along path
        vertexOffset++
      }
    }

    for (let i = 0; i < pointsCount - 1; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = pathStartVertex + i * (radialSegments + 1) + j
        const b = pathStartVertex + (i + 1) * (radialSegments + 1) + j
        const c = pathStartVertex + (i + 1) * (radialSegments + 1) + (j + 1)
        const d = pathStartVertex + i * (radialSegments + 1) + (j + 1)

        indices.push(a, b, d)
        indices.push(b, c, d)
      }
    }
  }

  if (!positions.length) return null

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setAttribute('aPathU', new THREE.Float32BufferAttribute(pathUs, 1))
  geo.setIndex(indices)
  return geo
}

export class NetworkFlows {
  public readonly group = new THREE.Group()
  private flowEntries: FlowMeshEntry[] = []
  private isLoaded = false
  private reducedMotion = false

  constructor() {
    this.group.name = 'NetworkFlows'
    this.checkReducedMotion()
  }

  private checkReducedMotion() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  public async load(url = `${import.meta.env.BASE_URL}data/network_flows.json`): Promise<void> {
    try {
      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`[NetworkFlows] Failed to fetch ${url}: ${res.status}`)
        return
      }
      const data: NetworkFlowsJson = await res.json()
      this.buildFlows(data)
      this.isLoaded = true
      console.info(`[NetworkFlows] Loaded ${this.flowEntries.length} flows (1 draw call each).`)
    } catch (err) {
      console.error('[NetworkFlows] Error loading network flows:', err)
    }
  }

  private buildFlows(data: NetworkFlowsJson) {
    for (const flow of data.flows) {
      const threePaths: THREE.Vector3[][] = []
      let sourcePaths = flow.paths
      if (flow.kind === 'power') {
        sourcePaths = feedFromSubstation(sourcePaths)
        if (flow.placement === 'aerial') {
          const asPoints = (path: readonly (readonly number[])[]) => path.map((point) => [...point])
          sourcePaths = [
            ...pylonIncomerPaths().map(asPoints),
            ...yardBusPaths().map(asPoints),
            ...substationOutletPaths().map(asPoints),
            ...sourcePaths,
          ]
        }
      }

      for (const path of sourcePaths) {
        if (path.length < 2) continue
        const converted = path.map(([bx, by, bz]) => {
          const v = blenderToThree(bx, by, bz)
          return new THREE.Vector3(v.x, v.y, v.z)
        })
        threePaths.push(converted)
      }

      const isUnderground = flow.placement === 'underground'
      const isFiber = flow.kind === 'fiber'
      const radius = isUnderground ? 0.25 : 0.12

      const geo = buildMergedTubeGeometry(threePaths, radius, isUnderground ? 8 : 6)
      if (!geo) continue

      // Aerial and underground use different hues so the two installations
      // stay readable: cyan / violet for fibre, amber / red for power.
      const baseColor = isFiber
        ? (isUnderground ? new THREE.Color('#b06cff') : new THREE.Color('#4ec3c7'))
        : (isUnderground ? new THREE.Color('#ff5a4a') : new THREE.Color('#f0b429'))

      const mat = new THREE.ShaderMaterial({
        vertexShader: FLOW_VERTEX_SHADER,
        fragmentShader: FLOW_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: baseColor },
          uSpeed: { value: this.reducedMotion ? 0.0 : 12.0 },
          uPulseWidth: { value: isUnderground ? 0.35 : 0.25 },
          uPulseFreq: { value: isUnderground ? 0.04 : 0.08 },
          uOpacity: { value: 0.0 },
          uBaseGlow: { value: isUnderground ? 0.45 : 0.3 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        // Souterrain visible à travers le sol
        depthTest: !isUnderground,
        side: THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.name = `Flow_${flow.id}`
      // Ensure underground flow renders on top of opaque ground
      mesh.renderOrder = isUnderground ? 999 : 50
      mesh.frustumCulled = false

      this.group.add(mesh)

      this.flowEntries.push({
        id: flow.id,
        kind: flow.kind,
        placement: flow.placement,
        mesh,
        material: mat,
        targetOpacity: 0.0,
        currentOpacity: 0.0,
        suppressed: false,
      })
    }
  }

  /**
   * Sets active visible flow kind ('fiber', 'power', 'all', or null).
   */
  /**
   * Hide a route whose geometry does not meet the loaded campus.
   * This drops old paths that no longer sit on the current site.
   */
  public pruneOutside(bounds: THREE.Box3) {
    const expanded = bounds.clone().expandByScalar(30)
    let kept = 0
    for (const entry of this.flowEntries) {
      const box = new THREE.Box3().setFromObject(entry.mesh)
      const aligned = expanded.intersectsBox(box) && box.getSize(new THREE.Vector3()).length() > 1
      entry.suppressed = !aligned
      if (!aligned) {
        entry.targetOpacity = 0
        entry.currentOpacity = 0
        entry.material.uniforms.uOpacity.value = 0
        entry.mesh.visible = false
      } else {
        kept += 1
      }
    }
    console.info(`[NetworkFlows] ${kept}/${this.flowEntries.length} routes align with the campus`)
  }

  public setActiveFlow(activeKind: 'fiber' | 'power' | 'all' | null) {
    for (const entry of this.flowEntries) {
      if (entry.suppressed) {
        entry.targetOpacity = 0
      } else if (activeKind === 'all' || (activeKind && entry.kind === activeKind)) {
        entry.targetOpacity = 1.0
      } else {
        entry.targetOpacity = 0.0
      }
    }
  }

  public update(dt: number, totalTime: number) {
    if (!this.isLoaded) return

    for (const entry of this.flowEntries) {
      // Smooth fade transition (400ms = ~0.4s)
      if (Math.abs(entry.currentOpacity - entry.targetOpacity) > 0.001) {
        const step = dt / 0.4
        if (entry.currentOpacity < entry.targetOpacity) {
          entry.currentOpacity = Math.min(entry.targetOpacity, entry.currentOpacity + step)
        } else {
          entry.currentOpacity = Math.max(entry.targetOpacity, entry.currentOpacity - step)
        }
        entry.material.uniforms.uOpacity.value = entry.currentOpacity
        entry.mesh.visible = entry.currentOpacity > 0.001
      }

      if (entry.mesh.visible && !entry.suppressed && !this.reducedMotion) {
        entry.material.uniforms.uTime.value = totalTime
      }
    }
  }

  public dispose() {
    for (const entry of this.flowEntries) {
      entry.mesh.geometry.dispose()
      entry.material.dispose()
    }
    this.flowEntries = []
    this.group.clear()
  }
}
