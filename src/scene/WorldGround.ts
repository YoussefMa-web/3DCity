import * as THREE from 'three'
import { RENDER } from './RenderSettings'
import { addEdgePlanting } from './Landscaping'

/**
 * Countryside repeat. Small enough to read as grass from a drone, large
 * enough that mipmaps turn it into tone instead of a tiled pattern.
 */
const WORLD_TILE_M = 7
/** Warm soil. Linear values — 0.2 already reads as a light khaki on screen. */
const EARTH = new THREE.Color(0.16, 0.11, 0.05)
/** Dry-season olive. Darker than the campus lawns, still clearly grass. */
const COUNTRY_GRASS = new THREE.Color(0.16, 0.22, 0.055)
/** How far the countryside disc sits under walking surfaces (meters). */
const BELOW_ROAD_M = 0.65
/** Soft bank width from campus rim into rolling hills (meters). */
const RIM_BLEND_M = 180

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function noise2(x: number, z: number) {
  const i = Math.floor(x)
  const j = Math.floor(z)
  const fx = x - i
  const fz = z - j
  const a = hash(i, j)
  const b = hash(i + 1, j)
  const c = hash(i, j + 1)
  const d = hash(i + 1, j + 1)
  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, ux), THREE.MathUtils.lerp(c, d, ux), uz)
}

function fbm(x: number, z: number) {
  return (
    noise2(x * 0.012, z * 0.012) * 0.48 +
    noise2(x * 0.032, z * 0.032) * 0.3 +
    noise2(x * 0.08, z * 0.08) * 0.14 +
    noise2(x * 0.2, z * 0.2) * 0.08
  )
}

/** Local Y of the countryside disc, relative to the campus center on XZ. */
export function pastureHeight(dx: number, dz: number, worldX: number, worldZ: number, campusR: number) {
  const d = Math.hypot(dx, dz)
  const under = 1 - THREE.MathUtils.smoothstep(d, campusR - 36, campusR + 24)
  const depression = -BELOW_ROAD_M * 1.4 * under
  const bermT = THREE.MathUtils.smoothstep(d, campusR - 8, campusR + 90)
  const berm = Math.sin(Math.min(1, bermT) * Math.PI) * 1.15 * (1 - under)
  const land = THREE.MathUtils.smoothstep(d, campusR + 6, campusR + 36)
  const farOut = THREE.MathUtils.smoothstep(d, campusR + 40, campusR + 200)
  const hills = (fbm(worldX, worldZ) - 0.5) * 28 * Math.max(land, farOut * 0.65)
  const ridges = (fbm(worldX * 0.45 + 20, worldZ * 0.45) - 0.5) * 10 * farOut
  const micro = (fbm(worldX * 2.2, worldZ * 2.2) - 0.5) * 2.2 * land
  const folds = (noise2(worldX * 0.048, worldZ * 0.048) - 0.5) * 7.5 * land
  const rolls = (noise2(worldX * 0.035, worldZ * 0.035) - 0.5) * 7 * land * (1 - under)
  return depression + berm + hills + ridges + micro + folds + rolls
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const t = THREE.MathUtils.clamp(p, 0, 1) * (sorted.length - 1)
  const i = Math.floor(t)
  const f = t - i
  const a = sorted[i]!
  const b = sorted[Math.min(i + 1, sorted.length - 1)]!
  return a + (b - a) * f
}

/** Walking-surface Y of roads/sidewalks — ignore rooftops and buried cables. */
export function estimateGroundY(root: THREE.Object3D, fallback: number) {
  const hit = /asphalte|trettoir|trottoir|voirie/i
  const skip = /roof|toiture|solar|panneau|facade|wall|mur/i
  const samples: number[] = []
  const box = new THREE.Box3()
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const label = `${mesh.name} ${mesh.parent?.name ?? ''}`
    if (!hit.test(label) || skip.test(label)) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    if (!mesh.geometry.boundingBox) return
    box.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld)
    const spanY = box.max.y - box.min.y
    if (spanY > 4) return
    samples.push(box.max.y)
  })
  return samples.length ? percentile(samples, 0.2) : fallback
}

function wrapMap(tex: THREE.Texture, anisotropy: number, color: boolean) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = anisotropy
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

async function groundMaterial(anisotropy: number) {
  const loader = new THREE.TextureLoader()
  loader.setPath(`${import.meta.env.BASE_URL}models/grass/textures/`)
  const [map, normalMap, roughnessMap] = await Promise.all([
    loader.loadAsync('Grass005_Color.jpg').catch(() => null),
    loader.loadAsync('Grass005_NormalGL.jpg').catch(() => null),
    loader.loadAsync('Grass005_Roughness.jpg').catch(() => null),
  ])

  // Low IBL — sky env on a huge flat disc reads as a blue plastic plate.
  const mat = new THREE.MeshStandardMaterial({
    name: 'world-ground',
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0,
    vertexColors: true,
    envMapIntensity: RENDER.ground.envMapIntensity,
    flatShading: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
  })
  if (map) mat.map = wrapMap(map, anisotropy, true)
    if (normalMap) {
    mat.normalMap = wrapMap(normalMap, anisotropy, false)
    mat.normalScale.set(2.1, 2.1)
  }
  if (roughnessMap) mat.roughnessMap = wrapMap(roughnessMap, anisotropy, false)
  return mat
}

/**
 * Textured rolling countryside under/around the campus.
 *
 * Uses a full CircleGeometry (not RingGeometry): a ring hole showed the
 * renderer clear-color as a harsh light-blue disc around the site. Instead
 * the disc is depressed under the footprint so authored roads/buildings
 * stay on top, with a soft berm + hills outside.
 */
export async function addWorldGround(
  scene: THREE.Scene,
  world: THREE.Box3,
  anisotropy: number,
) {
  const center = world.getCenter(new THREE.Vector3())
  const size = world.getSize(new THREE.Vector3())
  // Keep the flat pad tight — oversized footprints push all hills outside the overview frustum.
  const campusR = Math.min(200, Math.hypot(size.x * 0.5, size.z * 0.5) + 6)
  const radius = Math.max(2400, campusR * 8)
  const roadY = estimateGroundY(scene, Number.isFinite(world.min.y) ? world.min.y : 0)
  const groundY = roadY - BELOW_ROAD_M

  // Full disc: continuous land, no see-through hole / blue plate.
  const geo = new THREE.CircleGeometry(radius, 192, 0, Math.PI * 2)
  // Pack rings on the collar you see from a drone so the slopes
  // are not a handful of visible triangles.
  const radial = 104
  const disc = new THREE.BufferGeometry()
  {
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const thetaSeg = 288
    const focus = campusR + 220
    const focusRings = 78
    for (let r = 0; r <= radial; r++) {
      const rr =
        r <= focusRings
          ? (r / focusRings) * focus
          : focus + ((r - focusRings) / (radial - focusRings)) * (radius - focus)
      for (let t = 0; t <= thetaSeg; t++) {
        const a = (t / thetaSeg) * Math.PI * 2
        const x = Math.cos(a) * rr
        const z = Math.sin(a) * rr
        positions.push(x, 0, z)
        uvs.push(x / WORLD_TILE_M, -z / WORLD_TILE_M)
      }
    }
    const stride = thetaSeg + 1
    for (let r = 0; r < radial; r++) {
      for (let t = 0; t < thetaSeg; t++) {
        const a = r * stride + t
        const b = a + 1
        const c = a + stride
        const d = c + 1
        // CCW when viewed from +Y so FrontSide is visible from aerial cameras.
        indices.push(a, b, c, b, d, c)
      }
    }
    disc.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    disc.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    disc.setIndex(indices)
  }
  geo.dispose()

  const pos = disc.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const tmp = new THREE.Color()

  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i)
    const lz = pos.getZ(i)
    const x = lx + center.x
    const z = lz + center.z
    const d = Math.hypot(lx, lz)

    pos.setY(i, pastureHeight(lx, lz, x, z, campusR))

    // Near the campus the disc used to stay one saturated green. Break it
    // into olive pasture, dry khaki and darker clumps before the horizon wash.
    const edge = THREE.MathUtils.smoothstep(d, radius * 0.45, radius * 0.96)
    const under = 1 - THREE.MathUtils.smoothstep(d, campusR - 18, campusR + 6)
    const outside = THREE.MathUtils.smoothstep(d, campusR + 4, campusR + RIM_BLEND_M)
    const soil = THREE.MathUtils.clamp(outside * 0.22 + edge * 0.55 + under * 0.08, 0, 1)
    const patch = fbm(x * 0.07, z * 0.07)
    const dry = fbm(x * 0.018 + 8, z * 0.018)
    const clump = fbm(x * 0.16 + 3, z * 0.16)
    const field = noise2(x * 0.0035, z * 0.0035)
    tmp.copy(COUNTRY_GRASS)
    tmp.lerp(new THREE.Color(0.28, 0.19, 0.07), THREE.MathUtils.clamp(dry, 0, 1) * 0.55)
    tmp.lerp(new THREE.Color(0.05, 0.1, 0.025), THREE.MathUtils.clamp(clump, 0, 1) * 0.5)
    tmp.lerp(new THREE.Color(0.22, 0.16, 0.06), field * 0.4)
    tmp.lerp(new THREE.Color(0.07, 0.14, 0.03), (1 - field) * 0.28)
    tmp.r *= 0.9 + patch * 0.18
    tmp.g *= 0.88 + patch * 0.2
    tmp.b *= 0.82 + patch * 0.1
    tmp.lerp(EARTH, soil * 0.65)
    tmp.lerp(new THREE.Color(0.22, 0.24, 0.18), edge * 0.16)
    const crest = pos.getY(i)
    tmp.lerp(new THREE.Color(0.05, 0.08, 0.025), THREE.MathUtils.clamp(-crest / 8, 0, 1) * 0.45)
    tmp.lerp(new THREE.Color(0.26, 0.2, 0.08), THREE.MathUtils.clamp(crest / 12, 0, 1) * 0.4)
    colors[i * 3] = tmp.r
    colors[i * 3 + 1] = tmp.g
    colors[i * 3 + 2] = tmp.b
  }
  disc.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  disc.computeVertexNormals()

  const mat = await groundMaterial(anisotropy)
  const mesh = new THREE.Mesh(disc, mat)
  mesh.name = 'world-ground'
  mesh.position.set(center.x, groundY, center.z)
  mesh.receiveShadow = true
  mesh.castShadow = false
  mesh.frustumCulled = false
  mesh.userData.decoy = true
  mesh.userData.worldGround = true
  mesh.renderOrder = -2

  const skirtH = 140
  const skirt = new THREE.CylinderGeometry(radius * 0.995, radius * 1.08, skirtH, 96, 1, true)
  const skirtColors = new Float32Array(skirt.attributes.position.count * 3)
  for (let i = 0; i < skirt.attributes.position.count; i++) {
    const y = skirt.attributes.position.getY(i)
    const t = 1 - THREE.MathUtils.smoothstep(y, -skirtH * 0.45, skirtH * 0.35)
    tmp.copy(EARTH).lerp(new THREE.Color(0.18, 0.15, 0.1), t)
    skirtColors[i * 3] = tmp.r
    skirtColors[i * 3 + 1] = tmp.g
    skirtColors[i * 3 + 2] = tmp.b
  }
  skirt.setAttribute('color', new THREE.BufferAttribute(skirtColors, 3))
  const skirtMat = new THREE.MeshStandardMaterial({
    name: 'world-ground-skirt',
    color: 0xffffff,
    roughness: 0.98,
    metalness: 0,
    vertexColors: true,
    side: THREE.DoubleSide,
    envMapIntensity: 0,
  })
  const skirtMesh = new THREE.Mesh(skirt, skirtMat)
  skirtMesh.name = 'world-ground-skirt'
  skirtMesh.position.y = -skirtH * 0.5 + 2
  skirtMesh.receiveShadow = true
  skirtMesh.castShadow = false
  skirtMesh.frustumCulled = false
  mesh.add(skirtMesh)

  scene.add(mesh)
  addEdgePlanting(mesh, campusR, center.x, center.z, pastureHeight)
  console.info(
    '[ground] countryside disc r',
    radius.toFixed(0),
    'campusR',
    campusR.toFixed(0),
    'y',
    groundY.toFixed(2),
    'roadY',
    roadY.toFixed(2),
    'tileM',
    WORLD_TILE_M,
    'env',
    RENDER.ground.envMapIntensity,
    'map',
    Boolean(mat.map),
  )
  return mesh
}
