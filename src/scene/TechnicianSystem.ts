import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'
import { isInteriorName } from './look'

export interface TechnicianData {
  id: string
  role: string
  zone: string
  sector: 'solar' | 'telecom' | 'data' | 'poste'
  task: string
  position: [number, number, number] // Blender X, Y, Z
  rotationY: number // Orientation in radians
  helmetColor: string // '#f1c40f' (Yellow), '#ffffff' (White), '#3498db' (Blue), '#e67e22' (Orange)
  vestColor: string // '#dfff00' (Hi-vis fluorescent yellow) or '#ff5500' (Hi-vis safety orange)
  prop: 'tablet' | 'multimeter' | 'clipboard' | 'tools'
  camPos?: [number, number, number]
  isPatrolling?: boolean
  patrolPoints?: Array<[number, number, number]>
}

export const TECHNICIANS: TechnicianData[] = [
  // Energies — beside the plant, on the ground. Rooftop PV has no one on the roof.
  {
    id: 'tech-solar-field',
    role: 'Senior photovoltaic technician',
    zone: '1 MWc photovoltaic plant',
    sector: 'solar',
    task: 'Thermal inspection and GHI irradiance measurement',
    position: [-108, 258, 0],
    rotationY: Math.PI,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [-98, 246, 4.6],
  },
  {
    id: 'tech-solar-inverter',
    role: 'High-power electrical technician',
    zone: 'Delta SOLIVIA inverter row',
    sector: 'solar',
    task: 'DC/AC voltage check, surge arresters and Quadro cabinets',
    position: [-142, 270, 0],
    rotationY: Math.PI,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'multimeter',
    camPos: [-132, 258, 4.4],
  },
  {
    id: 'tech-solar-bess',
    role: 'BESS and LiFePO4 storage specialist',
    zone: '48 V lithium BESS container',
    sector: 'solar',
    task: 'BMS diagnostics, cell temperature and precision cooling',
    position: [-139, 247, 0],
    rotationY: -Math.PI / 2,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [-132, 240, 4.5],
  },
  {
    id: 'tech-solar-tech',
    role: 'LV switchboard and SCADA lead',
    zone: 'Solar technical room',
    sector: 'solar',
    task: 'Low-voltage distribution, RTU and MV metering check',
    position: [-130, 236, 0],
    rotationY: Math.PI,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'clipboard',
    camPos: [-124, 228, 4.6],
  },
  {
    id: 'tech-solar-delivery',
    role: 'MV delivery substation technician',
    zone: '1,000 kVA delivery substation',
    sector: 'solar',
    task: 'Transformer check, MV cubicles and decoupling relay',
    position: [-192, 226, 0],
    rotationY: -Math.PI / 2,
    helmetColor: '#e67e22',
    vestColor: '#ff5500',
    prop: 'multimeter',
    camPos: [-184, 220, 4.4],
  },
  {
    id: 'tech-solar-genset',
    role: 'Critical power engineer',
    zone: 'Generator yard',
    sector: 'solar',
    task: 'ATS transfer test and generator yard check',
    position: [-210, 188, 0],
    rotationY: Math.PI / 2,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'clipboard',
    camPos: [-204, 180, 4.8],
  },
  {
    id: 'tech-solar-carport',
    role: 'Solar canopy and EV technician',
    zone: 'Parking canopies',
    sector: 'solar',
    task: 'Canopy modules, structure bolts and charger pedestals',
    position: [-68, 219, 0],
    rotationY: 0.35,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'tools',
    camPos: [-62, 212, 4.2],
  },
  {
    id: 'tech-poste-source',
    role: '60/22 kV substation lead',
    zone: 'HV/MV source substation',
    sector: 'poste',
    task: 'SF6 breaker watch, 1000 kVA transformer and SCADA',
    position: [95, 165, 0],
    rotationY: Math.PI,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'tablet',
    camPos: [102, 157, 5.2],
  },
  {
    id: 'tech-patrol-solar',
    role: 'Patrol and maintenance agent',
    zone: 'Solar service road',
    sector: 'solar',
    task: 'Walking inspection of the fence and inverters',
    position: [-188, 174, 0],
    rotationY: 0,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'clipboard',
    camPos: [-188, 166, 4],
    isPatrolling: true,
    patrolPoints: [
      [-188, 174, 0],
      [-120, 174, 0],
      [-62, 174, 0],
      [-120, 174, 0],
    ],
  },
  // Telecom — tower apron, cabinets, east sidewalk, SRO, outside the data hall.
  {
    id: 'tech-tel-tower',
    role: 'Telecom and RF engineer',
    zone: '41 m lattice tower',
    sector: 'telecom',
    task: 'Microwave link audit, ICAO lighting and coaxial lines',
    position: [-90, 108, 0],
    rotationY: Math.PI,
    helmetColor: '#3498db',
    vestColor: '#ff5500',
    prop: 'clipboard',
    camPos: [-84, 100, 4.8],
  },
  {
    id: 'tech-tel-cabinet',
    role: 'Outdoor telecom power technician',
    zone: 'Shelters and 48 V power cabinets',
    sector: 'telecom',
    task: 'Preventive rectifier maintenance and VRLA battery bank test',
    position: [-66, 127, 0],
    rotationY: -Math.PI / 2,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'tools',
    camPos: [-60, 120, 4.5],
  },
  {
    id: 'tech-tel-aerial',
    role: 'Aerial fibre technician',
    zone: 'ADSS street span',
    sector: 'telecom',
    task: 'Pole clamps, slack loops and ADSS span check',
    position: [58.8, 210, 0],
    rotationY: -Math.PI / 2,
    helmetColor: '#3498db',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [66, 204, 4.2],
  },
  {
    id: 'tech-fiber-sro',
    role: 'Fibre and FTTx specialist',
    zone: 'Optical street cabinet (SRO)',
    sector: 'telecom',
    task: 'OTDR reflectometry and 144-fibre fusion splice check',
    position: [59, 296, 0],
    rotationY: -Math.PI / 2,
    helmetColor: '#ffffff',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [66, 290, 4],
  },
  {
    id: 'tech-tel-dc',
    role: 'Data center envelope technician',
    zone: 'Data center shell',
    sector: 'telecom',
    task: 'Wall penetrations, waterproofing and external plant',
    position: [-134, 198, 0],
    rotationY: -Math.PI / 2,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'clipboard',
    camPos: [-126, 190, 4.6],
  },
  {
    id: 'tech-patrol-telecom',
    role: 'Network and street supervisor',
    zone: 'East fibre sidewalk',
    sector: 'telecom',
    task: 'Underground chamber and ADSS aerial cable check',
    position: [61, 170, 0],
    rotationY: 0,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [68, 164, 4],
    isPatrolling: true,
    patrolPoints: [
      [61, 170, 0],
      [61, 240, 0],
      [61, 308, 0],
      [61, 240, 0],
    ],
  },
  // Managed services — outside the NOC, the fence and the data hall.
  {
    id: 'tech-data-noc',
    role: 'NOC field coordinator',
    zone: 'NOC building exterior',
    sector: 'data',
    task: 'Dispatch handoff, access log and facade plant check',
    position: [-170, 99, 0],
    rotationY: Math.PI,
    helmetColor: '#3498db',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [-164, 91, 5],
  },
  {
    id: 'tech-data-guard',
    role: 'Site and security supervisor',
    zone: 'Control post and CCTV perimeter',
    sector: 'data',
    task: 'Biometrics, access barriers and IR camera feeds',
    position: [-96, 128, 0],
    rotationY: -Math.PI * 0.7,
    helmetColor: '#3498db',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [-89, 120, 5.2],
  },
  {
    id: 'tech-data-perimeter',
    role: 'Perimeter patrol officer',
    zone: 'East fence and camera masts',
    sector: 'data',
    task: 'Fence line, IR cameras and gate log',
    position: [-54, 136, 0],
    rotationY: -Math.PI / 2,
    helmetColor: '#e67e22',
    vestColor: '#ff5500',
    prop: 'clipboard',
    camPos: [-46, 128, 4.8],
  },
  {
    id: 'tech-data-hall',
    role: 'Data hall security officer',
    zone: 'Data center access',
    sector: 'data',
    task: 'Biometric doors, anti-passback and external cameras',
    position: [-160, 178, 0],
    rotationY: Math.PI,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'tablet',
    camPos: [-154, 170, 4.6],
  },
]

function blenderToThree(x: number, y: number, z: number) {
  return new THREE.Vector3(x, z, -y)
}


const MODEL_URL = '/models/technician/worker.glb?v=seal'
const TARGET_HEIGHT = 1.78
/** Fast patrol. The clip is sped up in the same ratio, so the feet do not skate. */
const WALK_SPEED = 4.2
const WALK_TIME_SCALE = 3
/** Soles sit just above the ray hit so the boots are not inside the slab. */
const SOLE_CLEARANCE = 0.035
/**
 * Standing moment of the Mixamo idle, after the arms have dropped
 * and before the right glove rises onto the cheek.
 */
const IDLE_HOLD = 1.45

type Agent = {
  data: TechnicianData
  root: THREE.Group
  mixer: THREE.AnimationMixer
  idle: THREE.AnimationAction
  walk: THREE.AnimationAction
  moving: boolean
  route: THREE.Vector3[]
  patrolIndex: number
  patrolProgress: number
}

type Footprint = { minX: number; maxX: number; minZ: number; maxZ: number }

/**
 * Textured worker from Blender, with the Mixamo idle and walk baked on the rig.
 */
export class TechnicianSystem {
  readonly group = new THREE.Group()
  private readonly agents: Agent[] = []
  private readonly raycaster = new THREE.Raycaster()
  private readonly down = new THREE.Vector3(0, -1, 0)
  private readonly up = new THREE.Vector3(0, 1, 0)
  private readonly faceNormal = new THREE.Vector3()
  private groundMeshes: THREE.Object3D[] | null = null
  private coverMeshes: THREE.Object3D[] | null = null
  private footprints: Footprint[] | null = null

  async init(scene: THREE.Scene) {
    this.group.name = 'campus-technicians'
    scene.add(this.group)

    const gltf = await new GLTFLoader().loadAsync(MODEL_URL)
    const source = gltf.scene
    const idleClip = inPlace(pickClip(gltf.animations, /^idle$/i))
    const walkClip = inPlace(pickClip(gltf.animations, /^walk$/i)) ?? idleClip
    if (!idleClip || !walkClip || idleClip.tracks.length === 0) {
      throw new Error('technician model is missing idle or walk')
    }

    prepareHead(source)
    seatOnGround(source, idleClip, walkClip)
    await applyHelmetLogo(source)
    this.buildingFootprints(scene)
    this.collectCover(scene)

    for (const data of TECHNICIANS) {
      const body = cloneSkinned(source) as THREE.Object3D
      body.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.frustumCulled = false
        mesh.userData.technicianMesh = true
        const mat = mesh.material
        const list = Array.isArray(mat) ? mat : [mat]
        for (const entry of list) {
          const std = entry as THREE.MeshStandardMaterial
          if (!std || !('roughness' in std)) continue
          std.roughness = Math.max(std.roughness, 0.62)
          std.metalness = Math.min(std.metalness, 0.08)
          std.envMapIntensity = Math.min(std.envMapIntensity || 1, 0.7)
          if (/head/i.test(std.name)) sealHeadMaterial(std)
        }
      })

      const root = new THREE.Group()
      root.name = `technician:${data.id}`
      root.userData.technician = data
      root.add(body)

      const route = (data.patrolPoints ?? [data.position]).map((point) => this.placeOnGround(point, scene))
      root.position.copy(route[0]!)
      root.rotation.y = data.rotationY

      const mixer = new THREE.AnimationMixer(body)
      const idle = mixer.clipAction(idleClip)
      const walk = mixer.clipAction(walkClip)
      idle.setLoop(THREE.LoopRepeat, Infinity)
      walk.setLoop(THREE.LoopRepeat, Infinity)
      walk.timeScale = WALK_TIME_SCALE
      holdIdle(idle)
      mixer.update(0)

      this.group.add(root)
      this.agents.push({
        data,
        root,
        mixer,
        idle,
        walk,
        moving: false,
        route,
        patrolIndex: 0,
        patrolProgress: 0,
      })
    }

    for (const agent of this.agents) {
      const p = agent.root.position
      const cover = this.coverAbove(p.x, p.z)
      const inside = (this.footprints ?? []).some(
        (box) => p.x > box.minX && p.x < box.maxX && p.z > box.minZ && p.z < box.maxZ,
      )
      if (cover || inside) {
        console.warn('[campus] technician still under cover', agent.data.id, {
          at: [p.x, p.y, p.z].map((n) => +n.toFixed(2)),
          cover: cover?.name ?? null,
          inside,
        })
      }
    }

    console.info(`[campus] technicians: ${this.agents.length} characters, idle + walk`)
  }

  getTechniciansList() {
    return TECHNICIANS
  }

  getTechnicianById(id: string) {
    return TECHNICIANS.find((item) => item.id === id)
  }

  /** Where the character actually stands, after being moved out from under a roof. */
  getPlacement(id: string) {
    return this.agents.find((agent) => agent.data.id === id)?.root.position.clone() ?? null
  }

  update(dt: number) {
    for (const agent of this.agents) {
      const patrol = agent.data.isPatrolling && (agent.data.patrolPoints?.length ?? 0) >= 2
      this.setMoving(agent, Boolean(patrol))
      if (patrol && agent.data.patrolPoints) this.stepPatrol(agent, dt)
      agent.mixer.update(dt)
    }
  }

  private setMoving(agent: Agent, moving: boolean) {
    if (agent.moving === moving) return
    agent.moving = moving
    const next = moving ? agent.walk : agent.idle
    const prev = moving ? agent.idle : agent.walk
    prev.fadeOut(0.2)
    next.reset().fadeIn(0.2).play()
    if (!moving) holdIdle(next)
  }

  private stepPatrol(agent: Agent, dt: number) {
    const points = agent.route
    const from = points[agent.patrolIndex]!
    const to = points[(agent.patrolIndex + 1) % points.length]!
    const distance = Math.max(0.1, from.distanceTo(to))
    agent.patrolProgress += (WALK_SPEED * dt) / distance
    if (agent.patrolProgress >= 1) {
      agent.patrolProgress = 0
      agent.patrolIndex = (agent.patrolIndex + 1) % points.length
    }
    agent.root.position.lerpVectors(from, to, agent.patrolProgress)
    const dir = new THREE.Vector3().subVectors(to, from)
    if (dir.lengthSq() > 1e-4) {
      dir.normalize()
      agent.root.rotation.y = Math.atan2(dir.x, dir.z)
    }
  }

  private placeOnGround(blender: [number, number, number], scene: THREE.Scene) {
    const world = blenderToThree(...blender)
    const outside = this.leaveCoveredFloor(this.pushOutsideBuildings(world.x, world.z))
    const y = this.snapToGround(outside.x, outside.z, world.y, scene)
    return new THREE.Vector3(outside.x, y, outside.z)
  }

  private buildingFootprints(scene: THREE.Scene) {
    if (this.footprints) return this.footprints
    scene.updateMatrixWorld(true)
    const found: Footprint[] = []
    scene.traverse((obj) => {
      if (!BUILDING.test(obj.name)) return
      const box = new THREE.Box3().setFromObject(obj)
      if (box.isEmpty()) return
      const size = box.getSize(new THREE.Vector3())
      if (size.y < 2.2 || size.x < 2 || size.z < 2) return
      if (size.x > 160 || size.z > 160) return
      const inset = Math.min(0.7, size.x * 0.06, size.z * 0.06)
      if (size.x <= inset * 2 || size.z <= inset * 2) return
      found.push({
        minX: box.min.x + inset,
        maxX: box.max.x - inset,
        minZ: box.min.z + inset,
        maxZ: box.max.z - inset,
      })
    })
    this.footprints = found
    console.info(`[campus] building footprints: ${found.length}`)
    return found
  }

  /** Slide a point that landed inside a shell out to the nearest sidewalk side. */
  private pushOutsideBuildings(x: number, z: number) {
    const boxes = this.footprints ?? []
    let px = x
    let pz = z
    for (let pass = 0; pass < 4; pass++) {
      let moved = false
      for (const box of boxes) {
        if (px <= box.minX || px >= box.maxX || pz <= box.minZ || pz >= box.maxZ) continue
        const left = px - box.minX
        const right = box.maxX - px
        const near = pz - box.minZ
        const far = box.maxZ - pz
        const margin = 1.15
        const best = Math.min(left, right, near, far)
        if (best === left) px = box.minX - margin
        else if (best === right) px = box.maxX + margin
        else if (best === near) pz = box.minZ - margin
        else pz = box.maxZ + margin
        moved = true
      }
      if (!moved) break
    }
    if (px !== x || pz !== z) {
      console.info('[campus] technician moved out of a building', { from: [x, z], to: [px, pz] })
    }
    return { x: px, z: pz }
  }

  /** Roofs, shells and canopy decks. Open equipment yards are not in this list. */
  private collectCover(scene: THREE.Scene) {
    if (this.coverMeshes) return this.coverMeshes
    scene.updateMatrixWorld(true)
    const found: THREE.Object3D[] = []
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.geometry || !mesh.visible) return
      if (mesh.userData.decoy || mesh.userData.technicianMesh) return
      const label = surfaceLabel(mesh)
      if (!COVER.test(label)) return
      if (NAMED_GROUND.test(label) && !COVER.test(label)) return
      found.push(mesh)
    })
    this.coverMeshes = found
    return found
  }

  /** Largest roof or deck overhead. A small cabinet top does not count. */
  private coverAbove(x: number, z: number) {
    const targets = this.coverMeshes
    if (!targets?.length) return null
    this.raycaster.set(new THREE.Vector3(x, 0.35, z), this.up)
    this.raycaster.far = 24
    const hits = this.raycaster.intersectObjects(targets, false)
    let best: THREE.Object3D | null = null
    let bestArea = 8
    for (const hit of hits) {
      if (hit.point.y < 1.8 || hit.point.y > 22) continue
      if (hit.face) {
        this.faceNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
        if (Math.abs(this.faceNormal.y) < 0.55) continue
      }
      const box = new THREE.Box3().setFromObject(hit.object)
      const size = box.getSize(new THREE.Vector3())
      const area = size.x * size.z
      if (area <= bestArea) continue
      best = hit.object
      bestArea = area
    }
    return best
  }

  /**
   * Step to the near edge of whatever roof is overhead, so the character
   * stays on the same site apron instead of the covered floor.
   */
  private leaveCoveredFloor(point: { x: number; z: number }) {
    let px = point.x
    let pz = point.z
    for (let pass = 0; pass < 5; pass++) {
      const cover = this.coverAbove(px, pz)
      if (!cover) break
      const box = new THREE.Box3().setFromObject(cover)
      if (box.isEmpty()) break
      const left = px - box.min.x
      const right = box.max.x - px
      const near = pz - box.min.z
      const far = box.max.z - pz
      const margin = 1.8
      const best = Math.min(left, right, near, far)
      const nextX = best === left ? box.min.x - margin : best === right ? box.max.x + margin : px
      const nextZ = best === near ? box.min.z - margin : best === far ? box.max.z + margin : pz
      if (Math.hypot(nextX - px, nextZ - pz) < 0.2) break
      console.warn('[campus] technician left a covered floor', cover.name, [px, pz], [nextX, nextZ])
      px = nextX
      pz = nextZ
    }
    return { x: px, z: pz }
  }

  private walkableMeshes(scene: THREE.Scene) {
    if (this.groundMeshes) return this.groundMeshes
    scene.updateMatrixWorld(true)
    const targets: THREE.Object3D[] = []
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.geometry || !mesh.visible) return
      if (mesh.userData.decoy || mesh.userData.technicianMesh) return
      if (isInteriorName(mesh.name) || isInteriorName(mesh.parent?.name ?? '')) return
      const label = surfaceLabel(mesh)
      // A paving mesh parented under a shell is still the ground. Only the shell itself is skipped.
      if (BUILDING.test(mesh.name) && !isNamedGround(label)) return
      if (/^Flow_|source-power-lines|^sky$|edge-canopy/i.test(mesh.name)) return
      if (isOverheadSurface(label)) return
      let parent: THREE.Object3D | null = mesh
      while (parent) {
        if (parent.name === 'campus-technicians' || parent.name.startsWith('technician:')) return
        parent = parent.parent
      }
      targets.push(mesh)
    })
    this.groundMeshes = targets
    return targets
  }

  /**
   * Feet go on grass, paving or asphalt under about 2.4 m.
   * Roofs, canopy decks, cables and steep faces are skipped.
   * A canopy hit above the yard yields the ground underneath.
   * Waypoint heights are cached here; the patrol does not raycast per frame.
   */
  private snapToGround(x: number, z: number, _defaultY: number, scene?: THREE.Scene) {
    const targets = scene ? this.walkableMeshes(scene) : this.groundMeshes
    if (!targets?.length) return 0
    this.raycaster.set(new THREE.Vector3(x, 40, z), this.down)
    this.raycaster.far = 50
    const hits = this.raycaster.intersectObjects(targets, false)
    const candidates: THREE.Intersection[] = []
    for (const hit of hits) {
      const y = hit.point.y
      if (y > 2.4 || y < -0.35) continue
      if (hit.face) {
        this.faceNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
        if (this.faceNormal.y < 0.55) continue
      }
      if (isOverheadSurface(surfaceLabel(hit.object))) continue
      candidates.push(hit)
    }
    // Highest remaining surface, unless it is a deck floating over the yard.
    for (let i = 0; i < candidates.length; i++) {
      const y = candidates[i]!.point.y
      const deck = candidates.slice(i + 1).some((hit) => y - hit.point.y > 1.15)
      if (deck && !isNamedGround(surfaceLabel(candidates[i]!.object))) continue
      return y
    }
    return 0
  }
}

/** Modules, canopy steel, rooftops and chillers. Not the yard under them. */
const OVERHEAD = /seraphim|panneau|toiture|rooftop|chiller|chevron|omb_panne|omb_chevron|omb_poteau|edge-canopy/i
const NAMED_GROUND = /grass|herbe|gazon|asphalte|asphalt|trettoir|trottoir|voirie|dallage|canopy-ground|world-ground/i

function surfaceLabel(obj: THREE.Object3D) {
  const mesh = obj as THREE.Mesh
  const mat = mesh.material
  const matName = Array.isArray(mat) ? mat.map((entry) => entry.name).join(' ') : (mat?.name ?? '')
  return `${obj.name} ${obj.parent?.name ?? ''} ${matName}`
}

function isOverheadSurface(label: string) {
  if (NAMED_GROUND.test(label) && !OVERHEAD.test(label)) return false
  return OVERHEAD.test(label)
}

function isNamedGround(label: string) {
  return NAMED_GROUND.test(label) && !OVERHEAD.test(label)
}

function pickClip(clips: THREE.AnimationClip[], pattern: RegExp) {
  return clips.find((clip) => pattern.test(clip.name))
}

/** The patrol code moves the character. Hip translation would slide the walk off the path. */
function inPlace(clip: THREE.AnimationClip | undefined) {
  if (!clip) return clip
  const tracks = clip.tracks.filter((track) => !/Hips\.position$/.test(track.name))
  return new THREE.AnimationClip(clip.name, clip.duration, tracks)
}

/** Closed shells. Fences and open yards are not buildings. */
const BUILDING = /coque_du_batiment|BroadwayTheater_A_Building[AB]\b|Poste_garde/i
/** Building roofs and canopy decks. A module row only pushes the character to the aisle beside it. */
const COVER = /coque_du_batiment|toiture|rooftop|plafond|omb_panne|omb_chevron|seraphim|panneau|BroadwayTheater_A_Building[AB]\b/i

function prepareHead(model: THREE.Object3D) {
  model.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const entry of list) {
      const std = entry as THREE.MeshStandardMaterial
      if (std && /head/i.test(std.name)) sealHeadMaterial(std)
    }
  })
}

/** The head atlas is opaque. Transmission was punching a glass hole through the face. */
function sealHeadMaterial(std: THREE.MeshStandardMaterial) {
  const phys = std as THREE.MeshPhysicalMaterial
  phys.transparent = false
  phys.opacity = 1
  phys.alphaTest = 0
  phys.depthWrite = true
  phys.side = THREE.FrontSide
  phys.normalScale?.set(0.4, 0.4)
  phys.transmission = 0
  phys.transmissionMap = null
  phys.thickness = 0
  phys.needsUpdate = true
}

/** Freeze the standing moment. The rest of the idle puts a glove on the nose. */
function holdIdle(action: THREE.AnimationAction) {
  action.paused = true
  action.time = Math.min(IDLE_HOLD, Math.max(0, action.getClip().duration - 0.05))
  action.play()
}

/**
 * The shell UV does not match the helmet bake, so painting it on smears a
 * yellow shard across the brim. Hide that stray triangle and stick the real
 * NETIS mark on the front of the helmet.
 */
async function applyHelmetLogo(model: THREE.Object3D) {
  model.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    if (list.some((entry) => /^material\.003$/i.test((entry as THREE.Material)?.name ?? ''))) {
      mesh.visible = false
    }
  })

  const head = model.getObjectByName('mixamorigHead')
  if (!head) return
  const tex = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}netis_logo.png`)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.repeat.x = -1
  tex.offset.x = 1
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.023),
    new THREE.MeshBasicMaterial({
      map: tex,
      color: '#12336e',
      transparent: true,
      alphaTest: 0.35,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  card.name = 'helmet-logo'
  card.frustumCulled = false
  card.renderOrder = 3
  model.updateMatrixWorld(true)
  const front = helmetFront(model)
  card.position.copy(front)
  card.position.z -= 0.028
  card.rotation.y = Math.PI
  head.attach(card)
}

/** Forehead of the shell: in front, between the brim and the crown opening. */
function helmetFront(model: THREE.Object3D) {
  const v = new THREE.Vector3()
  const points: THREE.Vector3[] = []
  model.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh
    if (!mesh.isSkinnedMesh) return
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    if (!list.some((entry) => /helmet/i.test((entry as THREE.Material)?.name ?? ''))) return
    mesh.skeleton.update()
    const pos = mesh.geometry.attributes.position
    if (!pos) return
    for (let i = 0; i < pos.count; i++) {
      mesh.getVertexPosition(i, v)
      v.applyMatrix4(mesh.matrixWorld)
      points.push(v.clone())
    }
  })
  if (points.length === 0) return new THREE.Vector3(0, 1.65, -0.1)
  const ys = points.map((point) => point.y).sort((a, b) => a - b)
  const yBot = ys[0]!
  const yTop = ys[ys.length - 1]!
  const span = Math.max(0.05, yTop - yBot)
  const yLow = yBot + span * 0.38
  const yHigh = yBot + span * 0.58
  const band = points.filter((point) => point.y >= yLow && point.y <= yHigh)
  const pool = band.length > 0 ? band : points
  const zs = pool.map((point) => point.z).sort((a, b) => a - b)
  const zFront = zs[Math.floor(zs.length * 0.2)]!
  const face = pool.filter((point) => point.z <= zFront)
  const used = face.length > 0 ? face : pool
  const center = new THREE.Vector3()
  for (const point of used) center.add(point)
  center.multiplyScalar(1 / used.length)
  center.z = Math.min(...used.map((point) => point.z))
  return center
}

function seatOnGround(model: THREE.Object3D, idleClip: THREE.AnimationClip, walkClip: THREE.AnimationClip) {
  const mixer = new THREE.AnimationMixer(model)
  const idle = mixer.clipAction(idleClip)
  holdIdle(idle)
  mixer.update(0)
  model.updateMatrixWorld(true)
  const box = posedBounds(model)
  const height = Math.max(0.01, box.max.y - box.min.y)
  if (height < 1.4 || height > 2.2) {
    model.scale.multiplyScalar(TARGET_HEIGHT / height)
    model.updateMatrixWorld(true)
  }

  const standing = bootContact(model)
  mixer.stopAllAction()
  const walk = mixer.clipAction(walkClip)
  walk.setEffectiveWeight(1)
  walk.play()
  let lowest = standing.y
  const steps = 12
  for (let i = 0; i < steps; i++) {
    mixer.setTime((walkClip.duration * i) / steps)
    model.updateMatrixWorld(true)
    lowest = Math.min(lowest, bootContact(model).y)
  }
  model.position.x -= standing.x
  model.position.z -= standing.z
  model.position.y += SOLE_CLEARANCE - lowest
  mixer.stopAllAction()
  holdIdle(mixer.clipAction(idleClip))
  mixer.update(0)
}

/** Centre of the boot vertices that are actually touching down. */
function bootContact(model: THREE.Object3D) {
  const v = new THREE.Vector3()
  let minY = Infinity
  const points: THREE.Vector3[] = []
  model.updateMatrixWorld(true)
  model.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh
    if (!mesh.isSkinnedMesh) return
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    if (!list.some((entry) => /#66|boot/i.test((entry as THREE.Material)?.name ?? ''))) return
    mesh.skeleton.update()
    const pos = mesh.geometry.attributes.position
    if (!pos) return
    for (let i = 0; i < pos.count; i++) {
      mesh.getVertexPosition(i, v)
      v.applyMatrix4(mesh.matrixWorld)
      if (v.y < minY) minY = v.y
      points.push(v.clone())
    }
  })
  const contact = points.filter((point) => point.y <= minY + 0.04)
  const used = contact.length > 0 ? contact : points
  const center = new THREE.Vector3()
  if (used.length === 0) return center
  for (const point of used) center.add(point)
  center.multiplyScalar(1 / used.length)
  center.y = minY
  return center
}

function posedBounds(model: THREE.Object3D) {
  const box = new THREE.Box3()
  model.updateMatrixWorld(true)
  model.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh
    if (!mesh.isSkinnedMesh) return
    mesh.skeleton.update()
    mesh.computeBoundingBox()
    if (!mesh.boundingBox || mesh.boundingBox.isEmpty()) return
    box.union(mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld))
  })
  if (box.isEmpty()) box.setFromObject(model)
  return box
}
