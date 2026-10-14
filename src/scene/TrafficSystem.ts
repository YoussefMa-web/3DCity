import * as THREE from 'three'

const VEHICLE_ROOT =
  /KB3D_CMV_VehicCityBus|KB3D_CEV_VehicSedan|KB3D_CEV_VehicMidSUV/i
const AXIALE = /^SUB_Axiale/i
/** Strong cue: cabin front / driver sits toward the nose. */
const FRONT_HINT =
  /driver|front|headlight|phare|hood|capot|windshield|parebrise|mirror|frontdoor/i
/** Strong cue: rear body / passenger cabin toward the tail. */
const REAR_HINT = /rear|back|trunk|boot|tail|passenger|license|plaque|tailgate/i
const GLASS_HINT = /glass|verre|vitre|window|translucent|transl/i

const KMH = 1 / 3.6
/** Metres from dashed centerline to lane center. */
const LANE_OFFSET = 2.65
/** If a vehicle is farther than this from every painted lane, leave it parked. */
const MAX_SNAP_M = 40

type TrafficRoute = {
  id: string
  curve: THREE.CatmullRomCurve3
  length: number
  axis: 'x' | 'z'
}

type TrafficAgent = {
  root: THREE.Object3D
  model: THREE.Object3D
  route: TrafficRoute
  progress: number
  speed: number
  rideHeight: number
  /** Added to path yaw so measured local forward maps onto the lane tangent. */
  yawBias: number
  /** +1 toward the end of the spline, −1 back along the same lane. */
  direction: 1 | -1
}

type LengthForward = {
  /** Unit vector in model/local space along the vehicle length (nose direction). */
  localForward: THREE.Vector3
}

const _pos = new THREE.Vector3()
const _tan = new THREE.Vector3()
const _size = new THREE.Vector3()
const _worldQuat = new THREE.Quaternion()
const _localBox = new THREE.Box3()
const _meshBox = new THREE.Box3()
const _mat = new THREE.Matrix4()
const _invRoot = new THREE.Matrix4()
const _corner = new THREE.Vector3()

function vehicleClass(name: string): 'bus' | 'sedan' | 'suv' {
  if (/bus/i.test(name)) return 'bus'
  if (/suv/i.test(name)) return 'suv'
  return 'sedan'
}

function defaultSpeed(kind: 'bus' | 'sedan' | 'suv') {
  if (kind === 'bus') return 56 * KMH
  if (kind === 'suv') return 90 * KMH
  return 100 * KMH
}

/** Yaw that aims local −Z along horizontal (tx, tz). */
function pathYaw(tx: number, tz: number) {
  return Math.atan2(tx, -tz)
}

/**
 * Local-space AABB of the whole vehicle (all mesh primitives), in `root` space.
 * Avoids world-AABB distortion when the vehicle is rotated, and tiny first-prim boxes.
 */
function localHorizontalAabb(root: THREE.Object3D) {
  _localBox.makeEmpty()
  _invRoot.copy(root.matrixWorld).invert()
  let any = false
  root.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    const bb = mesh.geometry.boundingBox
    if (!bb) return
    _mat.copy(_invRoot).multiply(mesh.matrixWorld)
    _meshBox.copy(bb).applyMatrix4(_mat)
    if (_localBox.isEmpty()) _localBox.copy(_meshBox)
    else _localBox.union(_meshBox)
    any = true
  })
  return any ? _localBox : null
}

/**
 * Detect hood direction from geometry — NOT from lane tangent.
 * (Using tangent to pick the sign made the trunk lead = “driving backwards”.)
 *
 * 1) Longest local horizontal AABB side = length axis
 * 2) Sign from mesh/material cues (driver / front vs rear / passenger)
 */
function measureLengthForward(root: THREE.Object3D): LengthForward {
  root.updateWorldMatrix(true, true)
  const box = localHorizontalAabb(root)
  let axis: 'x' | 'z' = 'z'
  if (box && !box.isEmpty()) {
    box.getSize(_size)
    axis = _size.x >= _size.z ? 'x' : 'z'
  }

  const plus = axis === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)
  let sign = 1
  if (box && !box.isEmpty()) {
    const cue = noseSignFromMeshCues(root, box, axis)
    if (cue !== 0) sign = cue
  }

  return { localForward: plus.multiplyScalar(sign) }
}

/**
 * +1 → nose toward +local axis, -1 → toward −axis, 0 → unknown.
 * KitBash: driver seat marks the nose; passenger cabin marks the tail.
 * (License plates alone are ambiguous — both ends often share one atlas.)
 */
function noseSignFromMeshCues(root: THREE.Object3D, box: THREE.Box3, axis: 'x' | 'z') {
  let score = 0
  const mid = axis === 'x' ? (box.min.x + box.max.x) * 0.5 : (box.min.z + box.max.z) * 0.5
  const minA = axis === 'x' ? box.min.x : box.min.z
  const maxA = axis === 'x' ? box.max.x : box.max.z
  const span = Math.max(1e-3, maxA - minA)
  _invRoot.copy(root.matrixWorld).invert()

  root.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const label = `${mesh.name} ${mats.map((m) => m?.name ?? '').join(' ')}`

    mesh.getWorldPosition(_corner)
    _corner.applyMatrix4(_invRoot)
    const c = axis === 'x' ? _corner.x : _corner.z
    const towardPlus = c >= mid ? 1 : -1
    const edge = Math.min(Math.abs(c - minA), Math.abs(c - maxA)) / span

    // Driver / front body → strongest nose signal (sedan/SUV: −Z, bus: +X).
    if (/seatsdriver|driver/i.test(label)) score += 8 * towardPlus
    else if (FRONT_HINT.test(label)) score += 3 * towardPlus

    // Passenger cabin → toward the tail (city bus).
    if (/passenger/i.test(label)) score -= 6 * towardPlus
    else if (REAR_HINT.test(label) && edge < 0.2) score -= 2 * towardPlus

    if (GLASS_HINT.test(label) || mats.some((m) => m?.userData?.glass)) score += 1 * towardPlus
  })

  if (score > 0) return 1
  if (score < 0) return -1

  // Fallbacks from measured KitBash layouts when cues cancel.
  const name = root.name
  if (/bus/i.test(name) && axis === 'x') return 1
  if (/sedan|suv/i.test(name) && axis === 'z') return -1
  return 0
}

/**
 * Bias so R_y(pathYaw + bias) * localForward ≈ world tangent.
 * Samples 90° steps (KitBash roots are axis-aligned in local space).
 */
function yawBiasForForward(localForward: THREE.Vector3, tan: THREE.Vector3) {
  const py = pathYaw(tan.x, tan.z)
  const fx = localForward.x
  const fz = localForward.z
  let best = 0
  let bestDot = -Infinity
  for (const bias of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const th = py + bias
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    const wx = fx * cos + fz * sin
    const wz = -fx * sin + fz * cos
    const dot = wx * tan.x + wz * tan.z
    if (dot > bestDot) {
      bestDot = dot
      best = bias
    }
  }
  return best
}

type CenterLine = {
  id: string
  axis: 'x' | 'z'
  points: THREE.Vector3[]
}

/**
 * Traffic controlled from scene truth:
 * - Roads = SUB_Axiale paint clusters → dual lane splines
 * - Nose = longest local horizontal AABB axis (with glass tie-break)
 * - Motion = position on curve + yaw-only (pathYaw + yawBias)
 */
export class TrafficSystem {
  private readonly routes: TrafficRoute[] = []
  private readonly agents: TrafficAgent[] = []
  private readonly debugGroup = new THREE.Group()
  private enabled = false

  init(root: THREE.Object3D) {
    this.routes.length = 0
    this.agents.length = 0
    this.clearDebug(root)
    root.updateMatrixWorld(true)

    this.buildRoutesFromAxiale(root)
    if (!this.routes.length) {
      console.warn('[campus] traffic: no SUB_Axiale paint — vehicles stay parked')
      return
    }

    if (this.debugEnabled()) this.drawDebugLanes(root)

    this.collectVehicles(root)
    this.enabled = this.agents.length > 0
    console.info(
      `[campus] traffic: controlling ${this.agents.length} vehicles on ${this.routes.length} painted lanes`,
    )
  }

  update(dt: number) {
    if (!this.enabled || dt <= 0) return
    const step = Math.min(dt, 0.05)

    for (const agent of this.agents) {
      const { route } = agent
      agent.progress += (agent.direction * agent.speed * step) / route.length
      if (agent.progress >= 1) {
        agent.progress = 1
        agent.direction = -1
      } else if (agent.progress <= 0) {
        agent.progress = 0
        agent.direction = 1
      }

      const u = THREE.MathUtils.clamp(agent.progress, 0.001, 0.999)
      route.curve.getPointAt(u, _pos)
      route.curve.getTangentAt(u, _tan)
      if (agent.direction < 0) _tan.negate()
      _tan.y = 0
      if (_tan.lengthSq() < 1e-8) continue
      _tan.normalize()

      _pos.y = agent.rideHeight
      agent.root.position.copy(_pos)
      agent.root.rotation.set(0, pathYaw(_tan.x, _tan.z) + agent.yawBias, 0)
      agent.model.position.set(0, 0, 0)
      agent.model.rotation.set(0, 0, 0)
    }
  }

  private debugEnabled() {
    try {
      return typeof location !== 'undefined' && new URLSearchParams(location.search).has('trafficDebug')
    } catch {
      return false
    }
  }

  private clearDebug(root: THREE.Object3D) {
    if (this.debugGroup.parent) this.debugGroup.parent.remove(this.debugGroup)
    while (this.debugGroup.children.length) {
      const c = this.debugGroup.children[0]!
      this.debugGroup.remove(c)
      const line = c as THREE.Line
      line.geometry?.dispose()
      ;(line.material as THREE.Material | undefined)?.dispose?.()
    }
    this.debugGroup.name = 'traffic-debug'
    void root
  }

  private drawDebugLanes(root: THREE.Object3D) {
    const colors = [0x00e5ff, 0xffb000, 0x66ff66, 0xff66cc, 0xffffff]
    this.routes.forEach((route, i) => {
      const pts = route.curve.getPoints(64)
      for (const p of pts) p.y = 0.6
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({ color: colors[i % colors.length], depthTest: true })
      this.debugGroup.add(new THREE.Line(geo, mat))
    })
    root.add(this.debugGroup)
  }

  private buildRoutesFromAxiale(root: THREE.Object3D) {
    const marks: THREE.Vector3[] = []
    root.traverse((obj) => {
      if (!AXIALE.test(obj.name)) return
      const p = new THREE.Vector3()
      obj.getWorldPosition(p)
      marks.push(p)
    })
    if (!marks.length) return

    for (const center of this.clusterCenterLines(marks)) {
      this.addLanePair(center)
    }
  }

  private clusterCenterLines(marks: THREE.Vector3[]): CenterLine[] {
    const byX = new Map<number, THREE.Vector3[]>()
    const byZ = new Map<number, THREE.Vector3[]>()
    for (const p of marks) {
      const xk = Math.round(p.x)
      const zk = Math.round(p.z)
      if (!byX.has(xk)) byX.set(xk, [])
      byX.get(xk)!.push(p)
      if (!byZ.has(zk)) byZ.set(zk, [])
      byZ.get(zk)!.push(p)
    }

    const lines: CenterLine[] = []

    for (const [x, arr] of byX) {
      if (arr.length < 4) continue
      const sorted = [...arr].sort((a, b) => a.z - b.z)
      const pts: THREE.Vector3[] = []
      for (const p of sorted) {
        if (pts.length && Math.abs(pts[pts.length - 1]!.z - p.z) < 2) continue
        pts.push(new THREE.Vector3(x, 0.35, p.z))
      }
      if (pts.length >= 3) lines.push({ id: `ns-x${x}`, axis: 'x', points: pts })
    }

    for (const [z, arr] of byZ) {
      if (arr.length < 4) continue
      const xs = arr.map((p) => p.x)
      if (Math.max(...xs) - Math.min(...xs) < 30) continue
      const sorted = [...arr].sort((a, b) => a.x - b.x)
      const pts: THREE.Vector3[] = []
      for (const p of sorted) {
        if (pts.length && Math.abs(pts[pts.length - 1]!.x - p.x) < 2) continue
        pts.push(new THREE.Vector3(p.x, 0.35, z))
      }
      if (pts.length >= 3) lines.push({ id: `ew-z${z}`, axis: 'z', points: pts })
    }

    return lines
  }

  private addLanePair(center: CenterLine) {
    const { points, axis, id } = center
    const o = LANE_OFFSET
    const laneA = points.map((p) =>
      axis === 'x' ? new THREE.Vector3(p.x - o, p.y, p.z) : new THREE.Vector3(p.x, p.y, p.z - o),
    )
    const laneB = points.map((p) =>
      axis === 'x' ? new THREE.Vector3(p.x + o, p.y, p.z) : new THREE.Vector3(p.x, p.y, p.z + o),
    )
    this.pushRoute(`${id}-a`, laneA, axis)
    this.pushRoute(`${id}-b`, [...laneB].reverse(), axis)
  }

  private pushRoute(id: string, pts: THREE.Vector3[], axis: 'x' | 'z') {
    if (pts.length < 2) return
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05)
    this.routes.push({ id, curve, length: Math.max(1, curve.getLength()), axis })
  }

  private collectVehicles(root: THREE.Object3D) {
    const found: THREE.Object3D[] = []
    root.traverse((obj) => {
      if (obj === root) return
      if (!VEHICLE_ROOT.test(obj.name)) return
      if (obj.parent && VEHICLE_ROOT.test(obj.parent.name)) return
      found.push(obj)
    })

    const load = new Map<string, number>()
    for (const r of this.routes) load.set(r.id, 0)

    for (const obj of found) {
      obj.updateWorldMatrix(true, true)
      const worldPos = new THREE.Vector3()
      obj.getWorldPosition(worldPos)
      const kind = vehicleClass(obj.name)

      const picked = this.pickRoute(worldPos, kind, load)
      if (!picked) continue
      const snap = kind === 'bus' ? 90 : MAX_SNAP_M
      if (picked.dist > snap) {
        console.info(`[campus] traffic: leave parked ${obj.name} (nearest lane ${picked.dist.toFixed(1)}m)`)
        continue
      }

      let route = picked.route
      let progress = this.nearestProgress(route, worldPos)
      route.curve.getPointAt(progress, _pos)
      route.curve.getTangentAt(progress, _tan)
      _tan.y = 0
      _tan.normalize()

      // Geometric hood (independent of lane). Then pick a lane that matches that facing.
      const measured = measureLengthForward(obj)
      const noseW = measured.localForward.clone().applyQuaternion(obj.getWorldQuaternion(_worldQuat))
      noseW.y = 0
      if (noseW.lengthSq() > 1e-8) noseW.normalize()

      if (noseW.dot(_tan) < 0) {
        const opp = this.opposite(route)
        if (opp) {
          route = opp
          progress = this.nearestProgress(route, worldPos)
          route.curve.getTangentAt(progress, _tan)
          _tan.y = 0
          _tan.normalize()
        }
      }

      load.set(route.id, (load.get(route.id) ?? 0) + 1)
      progress = (progress + ((load.get(route.id) ?? 1) - 1) * 0.18) % 1
      this.mount(obj, route, progress, worldPos.y, kind, measured.localForward)
    }
  }

  private opposite(route: TrafficRoute) {
    const base = route.id.replace(/-[ab]$/, '')
    const want = route.id.endsWith('-a') ? `${base}-b` : `${base}-a`
    return this.routes.find((r) => r.id === want) ?? null
  }

  private pickRoute(
    pos: THREE.Vector3,
    kind: 'bus' | 'sedan' | 'suv',
    load: Map<string, number>,
  ): { route: TrafficRoute; dist: number } | null {
    let best: TrafficRoute | null = null
    let bestScore = Infinity
    let bestDist = Infinity

    for (const route of this.routes) {
      const u = this.nearestProgress(route, pos)
      route.curve.getPointAt(u, _pos)
      const dist = Math.hypot(_pos.x - pos.x, _pos.z - pos.z)
      const busBias = kind === 'bus' ? route.length * 0.015 : 0
      const score = dist + (load.get(route.id) ?? 0) * 15 - busBias
      if (score < bestScore) {
        bestScore = score
        bestDist = dist
        best = route
      }
    }

    if (!best) {
      for (const route of this.routes) {
        const u = this.nearestProgress(route, pos)
        route.curve.getPointAt(u, _pos)
        const dist = Math.hypot(_pos.x - pos.x, _pos.z - pos.z)
        if (dist < bestDist) {
          bestDist = dist
          best = route
        }
      }
    }
    return best ? { route: best, dist: bestDist } : null
  }

  private nearestProgress(route: TrafficRoute, pos: THREE.Vector3) {
    let bestU = 0
    let bestD = Infinity
    const n = 80
    for (let i = 0; i <= n; i++) {
      const u = i / n
      route.curve.getPointAt(Math.min(0.9999, u), _pos)
      const d = (_pos.x - pos.x) ** 2 + (_pos.z - pos.z) ** 2
      if (d < bestD) {
        bestD = d
        bestU = u
      }
    }
    return bestU
  }

  private mount(
    obj: THREE.Object3D,
    route: TrafficRoute,
    progress: number,
    rideHeight: number,
    kind: 'bus' | 'sedan' | 'suv',
    localForward: THREE.Vector3,
  ) {
    const parent = obj.parent
    if (!parent) return

    const u = THREE.MathUtils.clamp(progress, 0, 0.9999)
    route.curve.getPointAt(u, _pos)
    route.curve.getTangentAt(u, _tan)
    _tan.y = 0
    _tan.normalize()
    _pos.y = rideHeight

    // Map geometric hood onto travel direction (never the trunk).
    let yawBias = yawBiasForForward(localForward, _tan)
    // Guarantee hood leads: if the best 90° step still points against travel, flip 180°.
    {
      const th = pathYaw(_tan.x, _tan.z) + yawBias
      const cos = Math.cos(th)
      const sin = Math.sin(th)
      const wx = localForward.x * cos + localForward.z * sin
      const wz = -localForward.x * sin + localForward.z * cos
      if (wx * _tan.x + wz * _tan.z < 0) yawBias += Math.PI
    }

    const rig = new THREE.Group()
    rig.name = `traffic:${obj.name}`
    parent.add(rig)
    rig.position.copy(_pos)
    rig.rotation.set(0, pathYaw(_tan.x, _tan.z) + yawBias, 0)

    parent.remove(obj)
    obj.position.set(0, 0, 0)
    obj.rotation.set(0, 0, 0)
    obj.scale.set(1, 1, 1)
    rig.add(obj)

    obj.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.frustumCulled = true
    })

    this.agents.push({
      root: rig,
      model: obj,
      route,
      progress,
      speed: defaultSpeed(kind) * (0.95 + Math.random() * 0.1),
      rideHeight,
      yawBias,
      direction: 1,
    })
  }
}
