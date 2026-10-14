import * as THREE from 'three'
import { RENDER } from './RenderSettings'

const GLASS_NAME = /glass|verre|vitre|glazing|vitrage|plexiglass|plexiglas|translucent_glass|window|fenetre|curtainwall|baie|darkblue/i
const FRAME_NAME = /sill|frames?|frits|trim/i
const INTERIOR = /faux_plancher|amenagement_interieur|frames_inside|lestniza|confinement_d_allee|climatisation_de_precision|detection_extinction|onduleur_ups|distribution_electrique_tgbt|serveurs_stockage|reseau_datacenter|noc_gtc_supervision|video_surveillance/i

const size = new THREE.Vector3()
const box = new THREE.Box3()

export function hideGiants(root: THREE.Object3D) {
  root.updateMatrixWorld(true)
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || mesh.name === 'sky') return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    if (!mesh.geometry.boundingBox) return
    box.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld)
    box.getSize(size)
    if (Math.max(size.x, size.y, size.z) > 900) mesh.visible = false
  })
}

export function hideInteriors(root: THREE.Object3D) {
  setInteriorVisibility(root, false)
}

export function setInteriorVisibility(root: THREE.Object3D, visible: boolean) {
  root.traverse((obj) => {
    if (obj.name === 'sky') return
    if (INTERIOR.test(obj.name)) obj.visible = visible
  })
}

export function isInteriorName(name: string) {
  return INTERIOR.test(name)
}

const LAMP_MAST_NAME = /^EclS_Mat/i
const LAMP_HEAD_NAME = /^EclS_Tete/i
/** Arm vertices sit past this distance from the shaft axis. The shaft itself stays under ~0.1 m. */
const LAMP_ARM_RADIUS = 0.35
/** Heads farther than this (metres, horizontal) belong to another pole, or to none. */
const LAMP_PAIR_DISTANCE = 4
/** How far the arm root sinks into the shaft so the joint reads as welded. */
const LAMP_ARM_SINK = 0.03
/** Head-to-tip gaps at or under this stay as a seated joint. */
const LAMP_HEAD_GAP = 0.04

const lampA = new THREE.Vector3()
const lampB = new THREE.Vector3()
const lampC = new THREE.Vector3()
const lampSep = new THREE.Vector3()

/**
 * KitBash street lights ship the curved arm in the mast mesh, about 70 cm clear of
 * the shaft, and the luminaire is a sibling node parked on that floating tip.
 * Slide the arm onto the shaft and carry each paired head with it. Shared copies
 * of the mast geometry get one correction.
 */
export function seatStreetLamps(root: THREE.Object3D) {
  root.updateMatrixWorld(true)
  const masts: THREE.Mesh[] = []
  const heads: THREE.Mesh[] = []
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    if (LAMP_MAST_NAME.test(mesh.name)) masts.push(mesh)
    else if (LAMP_HEAD_NAME.test(mesh.name)) heads.push(mesh)
  })

  for (const mast of masts) seatLampArm(mast.geometry)

  for (const head of heads) {
    if (head.userData.lampHeadSeated) continue
    head.getWorldPosition(lampA)
    let best: THREE.Mesh | null = null
    let bestD = LAMP_PAIR_DISTANCE
    for (const mast of masts) {
      mast.getWorldPosition(lampB)
      const d = Math.hypot(lampA.x - lampB.x, lampA.z - lampB.z)
      if (d < bestD) {
        bestD = d
        best = mast
      }
    }
    if (!best) continue
    const delta = best.geometry.userData.lampArmDelta as THREE.Vector3 | undefined
    if (delta && delta.lengthSq() > 1e-8) {
      best.updateWorldMatrix(true, false)
      lampB.set(0, 0, 0).applyMatrix4(best.matrixWorld)
      lampC.copy(delta).applyMatrix4(best.matrixWorld).sub(lampB)
      addWorldDelta(head, lampC)
    }
    seatLampHead(head, best)
    head.userData.lampHeadSeated = true
  }
}

function seatLampArm(geometry: THREE.BufferGeometry) {
  if (geometry.userData.lampArmDelta) return
  const attr = geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!attr || attr.count < 8) {
    geometry.userData.lampArmDelta = new THREE.Vector3()
    return
  }

  let minY = Infinity
  for (let i = 0; i < attr.count; i++) minY = Math.min(minY, attr.getY(i))
  let ax = 0
  let az = 0
  let baseN = 0
  for (let i = 0; i < attr.count; i++) {
    if (attr.getY(i) >= minY + 0.25) continue
    ax += attr.getX(i)
    az += attr.getZ(i)
    baseN++
  }
  if (!baseN) {
    geometry.userData.lampArmDelta = new THREE.Vector3()
    return
  }
  ax /= baseN
  az /= baseN

  const radiusAt = (i: number) => Math.hypot(attr.getX(i) - ax, attr.getZ(i) - az)
  let root = -1
  let minArm = Infinity
  let maxArm = -1
  for (let i = 0; i < attr.count; i++) {
    const r = radiusAt(i)
    if (r <= LAMP_ARM_RADIUS || attr.getY(i) < 0.4) continue
    if (r < minArm) {
      minArm = r
      root = i
    }
    if (r > maxArm) maxArm = r
  }
  if (root < 0 || maxArm < 0) {
    geometry.userData.lampArmDelta = new THREE.Vector3()
    return
  }

  const rootY = attr.getY(root)
  let poleR = 0
  for (let i = 0; i < attr.count; i++) {
    const r = radiusAt(i)
    if (r < 0.25 && Math.abs(attr.getY(i) - rootY) < 0.25) poleR = Math.max(poleR, r)
  }
  const gap = minArm - poleR
  const delta = new THREE.Vector3()
  if (poleR > 0.02 && gap > LAMP_HEAD_GAP) {
    const dx = ax - attr.getX(root)
    const dz = az - attr.getZ(root)
    const len = Math.hypot(dx, dz) || 1
    const move = gap + LAMP_ARM_SINK
    delta.set((dx / len) * move, 0, (dz / len) * move)
  }

  let tx = 0
  let ty = 0
  let tz = 0
  let tn = 0
  for (let i = 0; i < attr.count; i++) {
    if (radiusAt(i) < maxArm - 0.08 || attr.getY(i) < 0.4) continue
    tx += attr.getX(i)
    ty += attr.getY(i)
    tz += attr.getZ(i)
    tn++
  }

  if (delta.lengthSq() > 0) {
    for (let i = 0; i < attr.count; i++) {
      if (radiusAt(i) <= LAMP_ARM_RADIUS || attr.getY(i) < 0.4) continue
      attr.setXYZ(i, attr.getX(i) + delta.x, attr.getY(i), attr.getZ(i) + delta.z)
    }
    attr.needsUpdate = true
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
  }

  geometry.userData.lampArmDelta = delta
  geometry.userData.lampArmTip = new THREE.Vector3(
    (tn ? tx / tn : 0) + delta.x,
    tn ? ty / tn : 0,
    (tn ? tz / tn : 0) + delta.z,
  )
}

function addWorldDelta(obj: THREE.Object3D, worldDelta: THREE.Vector3) {
  obj.getWorldPosition(lampA)
  lampA.add(worldDelta)
  const parent = obj.parent
  if (!parent) {
    obj.position.copy(lampA)
    return
  }
  parent.worldToLocal(lampA)
  obj.position.copy(lampA)
}

/** Slide a luminaire that still misses the arm tip (sideways or vertically) onto that tip. */
function seatLampHead(head: THREE.Mesh, mast: THREE.Mesh) {
  const tip = mast.geometry.userData.lampArmTip as THREE.Vector3 | undefined
  if (!tip) return
  head.updateWorldMatrix(true, false)
  mast.updateWorldMatrix(true, false)
  lampA.copy(tip).applyMatrix4(mast.matrixWorld)
  head.worldToLocal(lampA)
  const geo = head.geometry
  if (!geo.boundingBox) geo.computeBoundingBox()
  const bb = geo.boundingBox
  if (!bb) return
  lampSep.set(0, 0, 0)
  if (lampA.x < bb.min.x) lampSep.x = lampA.x - bb.min.x
  else if (lampA.x > bb.max.x) lampSep.x = lampA.x - bb.max.x
  if (lampA.y < bb.min.y) lampSep.y = lampA.y - bb.min.y
  else if (lampA.y > bb.max.y) lampSep.y = lampA.y - bb.max.y
  if (lampA.z < bb.min.z) lampSep.z = lampA.z - bb.min.z
  else if (lampA.z > bb.max.z) lampSep.z = lampA.z - bb.max.z
  if (lampSep.length() <= LAMP_HEAD_GAP) return
  lampSep.addScaledVector(lampSep.clone().normalize(), 0.012)
  lampB.set(0, 0, 0).applyMatrix4(head.matrixWorld)
  lampC.copy(lampSep).applyMatrix4(head.matrixWorld).sub(lampB)
  addWorldDelta(head, lampC)
}

const GROUND_MESH = /^(trettoir|asphalte|voirie)$/i
const GROUND_PLANE = /^Plane\.\d+/i

function isGroundMesh(mesh: THREE.Mesh) {
  if (GROUND_MESH.test(mesh.name)) return true
  const parent = mesh.parent?.name ?? ''
  if (/^(asphalte|voirie|trettoir)$/i.test(mesh.name)) return true
  if (/^(asphalte|voirie)$/i.test(parent)) return true
  // Multi-primitive sidewalk loads as Group "trettoir" → child meshes.
  if (/^trettoir$/i.test(parent)) {
    if (GROUND_PLANE.test(mesh.name) || !mesh.name) return true
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    if (
      mats.some((m) =>
        /concrete|stonetile|kb3d_mim_concrete|grass/i.test(`${(m as THREE.Material)?.name ?? ''}`),
      )
    ) {
      return true
    }
  }
  return false
}

function isRoadMarking(label: string) {
  return /mark|ligne|line|peinture|striping|crosswalk|passage|marquage|axiale|pieton|pi[eé]ton|sub_axiale|sub_pieton/i.test(
    label,
  )
}

function isAsphaltLabel(label: string) {
  if (isRoadMarking(label)) return false
  return /asphalt|asphalte|tar|voirie|route/.test(label)
}

function isGrassLabel(label: string) {
  return /grass|herbe|gazon|pelouse|lawn|green grass/i.test(label)
}

function isLawnMaterial(mat: THREE.Material | undefined | null, mesh: THREE.Mesh) {
  if (!mat) return false
  if (isGrassLabel(`${mat.name} ${mesh.name}`)) return true
  const std = mat as THREE.MeshStandardMaterial
  if (!std.color || /solar|panel|metal|roof|toiture|glass|verre/i.test(`${std.name} ${mesh.name}`)) return false
  const { r, g, b } = std.color
  return g > 0.22 && g > r + 0.04 && g > b + 0.02
}

function hasUvAttribute(mesh: THREE.Mesh) {
  return Boolean(mesh.geometry?.getAttribute('uv'))
}

/**
 * Sidewalk planes in site.glb ship KitBash PBR maps + KHR_texture_transform
 * repeats, but often omit TEXCOORD_0. Rebuild 0–1 planar UVs from local XZ
 * so authored repeats stay correct (do NOT write world-metre UVs).
 */
function ensurePlanarUVs(mesh: THREE.Mesh) {
  const geom = mesh.geometry
  if (!geom || geom.getAttribute('uv')) return
  const pos = geom.getAttribute('position')
  if (!pos) return
  if (!geom.boundingBox) geom.computeBoundingBox()
  const bb = geom.boundingBox
  if (!bb) return
  const sx = Math.max(1e-5, bb.max.x - bb.min.x)
  const sz = Math.max(1e-5, bb.max.z - bb.min.z)
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / sx
    uv[i * 2 + 1] = 1 - (pos.getZ(i) - bb.min.z) / sz
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

function groundTileMeters(_kind: 'pave') {
  return 1.6
}

function prepareMap(map: THREE.Texture, repeat: number, anisotropy: number, color: boolean) {
  const tex = map.clone()
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat, repeat)
  tex.offset.set(0, 0)
  tex.center.set(0, 0)
  tex.rotation = 0
  tex.anisotropy = anisotropy
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.needsUpdate = true
  return tex
}

const tiles = new Map<string, THREE.CanvasTexture>()

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function tileTexture(key: string, paint: (ctx: CanvasRenderingContext2D, size: number) => void, color: boolean, size = 512) {
  const cached = tiles.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  paint(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.anisotropy = 8
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.needsUpdate = true
  tiles.set(key, tex)
  return tex
}

/** Speckled zinc / cast concrete for bare poles whose atlas is a flat CAD fill. */
function galvanizedTexture() {
  return tileTexture('galvanized', (ctx, size) => {
    const img = ctx.createImageData(size, size)
    const data = img.data
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        const n = hash(x * 0.41, y * 0.37)
        const n2 = hash(x * 0.08 + 3.2, y * 0.11 + 1.4)
        const spangle = Math.sin(x * 0.17 + y * 0.04) * Math.cos(y * 0.13) * 0.5 + 0.5
        let v = 176 + (n - 0.5) * 34 + (n2 - 0.5) * 16 + (spangle - 0.5) * 14
        v = Math.max(132, Math.min(214, v))
        data[i] = v
        data[i + 1] = v + 1
        data[i + 2] = v - 3
        data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    for (let k = 0; k < 2200; k++) {
      const x = Math.floor(hash(k, 2.2) * size)
      const y = Math.floor(hash(k, 8.4) * size)
      ctx.fillStyle = `rgba(60,62,64,${0.12 + hash(k, 6.1) * 0.38})`
      ctx.fillRect(x, y, 1 + (k % 2), 1)
    }
  }, true, 512)
}

/** Last-resort sidewalk tile only when the GLTF has no albedo at all. */
function paveTexture() {
  return tileTexture('pave', (ctx, size) => {
    ctx.fillStyle = '#b9b4ab'
    ctx.fillRect(0, 0, size, size)
    const cell = 64
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        const n = hash(x * 0.37, y * 0.41)
        const shade = 168 + Math.floor(n * 28)
        ctx.fillStyle = `rgb(${shade},${shade - 3},${shade - 8})`
        ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4)
        ctx.strokeStyle = 'rgba(90,88,82,0.35)'
        ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)
      }
    }
  }, true, 1024)
}

function tuneGroundMaterial(source: THREE.Material, mesh: THREE.Mesh, anisotropy: number) {
  const mat = source as THREE.MeshStandardMaterial
  if (!mat || !('color' in mat)) return source
  const label = `${mat.name} ${mesh.name}`
  if (isGrassLabel(label)) return source
  if (isAsphaltLabel(label.toLowerCase())) return source
  if (isRoadMarking(label)) return source

  const next = mat.clone()
  if (next.map || next.normalMap || next.roughnessMap) {
    // Preserve KitBash / Blender PBR (ConcretePolishBlocks, Ground Concrete, …).
    applyAnisotropy(next, anisotropy)
    if (next.map) next.map.colorSpace = THREE.SRGBColorSpace
    // Concrete must not read as metal if a factor was exported hot.
    if (!next.metalnessMap) next.metalness = Math.min(next.metalness ?? 0, 0.08)
    next.envMapIntensity = RENDER.ground.envMapIntensity
    next.polygonOffset = true
    next.polygonOffsetFactor = 1
    next.polygonOffsetUnits = 1
    stabilizePhysical(next)
    next.needsUpdate = true
    return next
  }

  // Untextured ground only — procedural fallback.
  ensurePlanarUVs(mesh)
  const repeat = 1 / groundTileMeters('pave')
  next.map = prepareMap(paveTexture(), repeat, anisotropy, true)
  next.color.set('#ffffff')
  next.envMapIntensity = RENDER.ground.envMapIntensity
  next.metalness = 0
  next.roughness = 0.86
  next.polygonOffset = true
  next.polygonOffsetFactor = 1
  next.polygonOffsetUnits = 1
  stabilizePhysical(next)
  next.needsUpdate = true
  return next
}

/**
 * The generator canopy mesh is about 1.46 m tall and then carries a uniform
 * node scale of ~3.2–3.5, so the enclosure stands 4.7–5.2 m — a small building
 * beside a 1.78 m technician. Bring each copy down to a mid-size soundproof
 * canopy and keep the base center planted.
 */
const GENSET_CANOPY = /^NETCOM_DCF-04_Groupe_electrogene(?:\.?\d+)?$/i
const GENSET_CANOPY_HEIGHT = 2.6

const gensetBox = new THREE.Box3()
const gensetSize = new THREE.Vector3()
const gensetAnchor = new THREE.Vector3()
const gensetLocalAnchor = new THREE.Vector3()
const gensetParentInv = new THREE.Matrix4()

export function fitGeneratorCanopies(root: THREE.Object3D) {
  root.updateMatrixWorld(true)
  root.traverse((obj) => {
    if (!GENSET_CANOPY.test(obj.name) || obj.userData.gensetCanopyFitted) return
    gensetBox.setFromObject(obj)
    if (gensetBox.isEmpty()) return
    const beforeMinY = gensetBox.min.y
    const beforeCenterX = (gensetBox.min.x + gensetBox.max.x) * 0.5
    const beforeCenterZ = (gensetBox.min.z + gensetBox.max.z) * 0.5
    gensetBox.getSize(gensetSize)
    const height = gensetSize.y
    if (height < 1 || height > 12) return
    const factor = GENSET_CANOPY_HEIGHT / height
    const parent = obj.parent
    if (!parent || Math.abs(factor - 1) < 0.03) {
      obj.userData.gensetCanopyFitted = true
      return
    }
    gensetAnchor.set(beforeCenterX, beforeMinY, beforeCenterZ)
    parent.updateWorldMatrix(true, false)
    gensetParentInv.copy(parent.matrixWorld).invert()
    gensetLocalAnchor.copy(gensetAnchor).applyMatrix4(gensetParentInv)
    obj.position.multiplyScalar(factor).addScaledVector(gensetLocalAnchor, 1 - factor)
    obj.scale.multiplyScalar(factor)
    obj.updateMatrixWorld(true)
    obj.userData.gensetCanopyFitted = true
  })
}

export function finishMesh(mesh: THREE.Mesh, anisotropy: number) {
  const ground = isGroundMesh(mesh)
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  const hasMap = materials.some((mat) => Boolean((mat as THREE.MeshStandardMaterial).map))
  // Textured sidewalks missing TEXCOORD_0 need local planar UVs (keep KHR repeats).
  if (ground && hasMap && !hasUvAttribute(mesh)) ensurePlanarUVs(mesh)
  if (ground && !hasMap) ensurePlanarUVs(mesh)

  const next = materials.map((mat) =>
    ground ? tuneGroundMaterial(mat, mesh, anisotropy) : tuneMaterial(mat, mesh, anisotropy),
  )
  mesh.material = Array.isArray(mesh.material) ? next : next[0]

  const name = `${mesh.name}`.toLowerCase()
  const glass = next.some((mat) => mat.userData.glass)
  const grass = next.some((mat) => isLawnMaterial(next[0] as THREE.Material, mesh)) || isGrassLabel(name)
  // World-space size — local geom can be tiny under GLTF node scale and would
  // never cast (full-bright CAD look with zero sun shadows).
  mesh.updateWorldMatrix(true, false)
  box.setFromObject(mesh)
  box.getSize(size)
  const large = Math.max(size.x, size.y, size.z) > 0.5
  // Opaque reflective glass must cast — otherwise towers throw no sun shadow.
  mesh.castShadow = !ground && !grass && large
  mesh.receiveShadow = true
  mesh.frustumCulled = true

  if (isSidewalkSlab(mesh)) {
    for (const mat of next) {
      const std = mat as THREE.MeshStandardMaterial
      std.polygonOffset = false
      if ('roughness' in std) std.roughness = Math.max(std.roughness || 0, 0.9)
    }
    roundSidewalkNose(mesh)
  }
}

function isSidewalkSlab(mesh: THREE.Mesh) {
  return /trettoir|trottoir|dallage|bordure/i.test(`${mesh.name} ${mesh.parent?.name ?? ''}`)
}

const triA = new THREE.Vector3()
const triB = new THREE.Vector3()
const triC = new THREE.Vector3()
const triN = new THREE.Vector3()

function triangleNormal(pos: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, ia: number, ib: number, ic: number, out: THREE.Vector3) {
  triA.fromBufferAttribute(pos, ia)
  triB.fromBufferAttribute(pos, ib)
  triC.fromBufferAttribute(pos, ic)
  triB.sub(triA)
  triC.sub(triA)
  return out.crossVectors(triB, triC)
}

/**
 * site.glb sidewalk (`trettoir` / Plane.006) is a closed extruded slab.
 * Top and side shells do not share vertices, so a boundary-edge lip never
 * attached and the sharp vertical face stayed visible. Rebuild a quarter-round
 * from each vertical face's top edge and drop that face.
 */
function roundSidewalkNose(mesh: THREE.Mesh) {
  if (mesh.userData.softCurb) return
  const geo = mesh.geometry
  const index = geo.getIndex()
  const position = geo.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!index || !position) return

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  const groups = geo.groups.length
    ? geo.groups
    : [{ start: 0, count: index.count, materialIndex: 0 }]

  const tops: THREE.Vector3[] = []
  type Lip = { ax: number; ay: number; az: number; bx: number; by: number; bz: number; nx: number; nz: number; span: number }
  const lips: Lip[] = []
  const seen = new Set<string>()
  const q = (v: number) => Math.round(v * 4000)

  for (const group of groups) {
    const mat = materials[group.materialIndex ?? 0]
    if (/grass|herbe|gazon/i.test(mat?.name ?? '')) continue
    const end = group.start + group.count
    tops.length = 0
    for (let t = group.start; t + 2 < end; t += 3) {
      const ia = index.getX(t)
      const ib = index.getX(t + 1)
      const ic = index.getX(t + 2)
      triangleNormal(position, ia, ib, ic, triN)
      const len = triN.length() || 1
      if (triN.y / len > 0.75) {
        triA.fromBufferAttribute(position, ia)
        triB.fromBufferAttribute(position, ib)
        triC.fromBufferAttribute(position, ic)
        tops.push(new THREE.Vector3().add(triA).add(triB).add(triC).multiplyScalar(1 / 3))
      }
    }
    if (!tops.length) continue

    for (let t = group.start; t + 2 < end; t += 3) {
      const ids = [index.getX(t), index.getX(t + 1), index.getX(t + 2)]
      triangleNormal(position, ids[0]!, ids[1]!, ids[2]!, triN)
      const len = triN.length() || 1
      if (Math.abs(triN.y / len) >= 0.35) continue
      const verts = ids.map((id) => {
        const p = new THREE.Vector3().fromBufferAttribute(position, id!)
        return p
      })
      let yMax = -Infinity
      let yMin = Infinity
      for (const p of verts) {
        yMax = Math.max(yMax, p.y)
        yMin = Math.min(yMin, p.y)
      }
      const span = yMax - yMin
      if (span < 1e-4) continue
      const top = verts.filter((p) => yMax - p.y < span * 0.18)
      if (top.length < 2) continue
      const a = top[0]!
      const b = top[1]!
      const mx = (a.x + b.x) * 0.5
      const mz = (a.z + b.z) * 0.5
      let nearest = tops[0]!
      let best = Infinity
      for (const c of tops) {
        const d = (c.x - mx) * (c.x - mx) + (c.z - mz) * (c.z - mz)
        if (d < best) {
          best = d
          nearest = c
        }
      }
      let nx = triN.x / len
      let nz = triN.z / len
      if (nx * (nearest.x - mx) + nz * (nearest.z - mz) > 0) {
        nx = -nx
        nz = -nz
      }
      const horiz = Math.hypot(nx, nz)
      if (horiz < 1e-5) continue
      nx /= horiz
      nz /= horiz
      const key = `${q(a.x)},${q(a.z)}|${q(b.x)},${q(b.z)}`
      const key2 = `${q(b.x)},${q(b.z)}|${q(a.x)},${q(a.z)}`
      if (seen.has(key) || seen.has(key2)) continue
      seen.add(key)
      lips.push({ ax: a.x, ay: a.y, az: a.z, bx: b.x, by: b.y, bz: b.z, nx, nz, span })
    }
  }

  if (lips.length < 4) return

  const steps = 5
  const positions: number[] = []
  const indices: number[] = []
  for (const lip of lips) {
    if (Math.hypot(lip.bx - lip.ax, lip.bz - lip.az) < 1e-5) continue
    const base = positions.length / 3
    const ends = [
      { x: lip.ax, y: lip.ay, z: lip.az },
      { x: lip.bx, y: lip.by, z: lip.bz },
    ]
    for (const origin of ends) {
      const radius = lip.span
      for (let s = 0; s <= steps; s++) {
        const ang = (s / steps) * (Math.PI / 2)
        positions.push(
          origin.x + lip.nx * Math.sin(ang) * radius,
          origin.y - radius * (1 - Math.cos(ang)) + lip.span * 0.02,
          origin.z + lip.nz * Math.sin(ang) * radius,
        )
      }
    }
    const span = steps + 1
    for (let s = 0; s < steps; s++) {
      const a0 = base + s
      const a1 = a0 + 1
      const b0 = base + span + s
      const b1 = b0 + 1
      indices.push(a0, b0, a1, a1, b0, b1)
    }
  }
  if (indices.length < 24) return

  const curbGeo = new THREE.BufferGeometry()
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  curbGeo.setIndex(indices)
  curbGeo.computeVertexNormals()
  const curb = new THREE.Mesh(
    curbGeo,
    new THREE.MeshStandardMaterial({
      name: 'sidewalk-curb',
      color: 0xe4e0d8,
      roughness: 0.94,
      metalness: 0,
      envMapIntensity: 0.28,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  )
  curb.name = 'sidewalk-curb'
  curb.castShadow = true
  curb.receiveShadow = true
  mesh.add(curb)
  dropVerticalFaces(mesh)
  mesh.userData.softCurb = true
}

function dropVerticalFaces(mesh: THREE.Mesh) {
  const geo = mesh.geometry
  const index = geo.getIndex()
  const position = geo.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!index || !position) return
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  const groups = geo.groups.length
    ? geo.groups.slice()
    : [{ start: 0, count: index.count, materialIndex: 0 }]
  const next: number[] = []
  geo.clearGroups()
  for (const group of groups) {
    const mat = materials[group.materialIndex ?? 0]
    const grass = /grass|herbe|gazon/i.test(mat?.name ?? '')
    const start = next.length
    const end = group.start + group.count
    for (let t = group.start; t + 2 < end; t += 3) {
      const ia = index.getX(t)
      const ib = index.getX(t + 1)
      const ic = index.getX(t + 2)
      if (!grass) {
        triangleNormal(position, ia, ib, ic, triN)
        const len = triN.length() || 1
        if (Math.abs(triN.y / len) < 0.35) continue
      }
      next.push(ia, ib, ic)
    }
    const count = next.length - start
    if (count > 0) geo.addGroup(start, count, group.materialIndex ?? 0)
  }
  geo.setIndex(next)
  geo.computeVertexNormals()
  geo.computeBoundingBox()
  geo.computeBoundingSphere()
}

/** Section roots are named after the file (`solar`, `site`…). They are not a material. */
const SECTION_ROOT = /^(site|solar|carport|telecom|datacenter|datacenter-exterior|reseau|poste|noc|solar-equip)$/i

function surfaceLabel(mat: THREE.Material, mesh: THREE.Mesh) {
  const parent = mesh.parent?.name ?? ''
  const parentPart = SECTION_ROOT.test(parent) ? '' : parent
  return `${mat.name} ${mesh.name} ${parentPart}`.toLowerCase()
}

function isPvModule(label: string) {
  return /panneau|photovolta|module_pv|cellule|seraphim|solar panel/i.test(label)
}

/** Unauthored glTF material: no name and no maps. The loader fallback is a rough metal, so it renders black. */
function isBareMaterial(mat: THREE.MeshStandardMaterial) {
  return !mat.name && !mat.map && !mat.normalMap && !mat.roughnessMap && !mat.metalnessMap
}

function isGlass(mat: THREE.MeshStandardMaterial, mesh: THREE.Mesh) {
  const label = surfaceLabel(mat, mesh)
  if (FRAME_NAME.test(label) && !GLASS_NAME.test(label)) return false
  if (GLASS_NAME.test(label)) return true
  const physical = mat as THREE.MeshPhysicalMaterial
  if ('transmission' in physical && physical.transmission > 0.25 && mat.roughness < 0.18) return true
  return Boolean(mat.transparent && mat.opacity < 0.25)
}

const POLE_LABEL = /poteau|massif|pyl[oô]ne|lampadaire|cand[eé]labre|cts_lamp|ecls_mat|ecls_tete|ecl_cross|(?:^|[^a-z])poles?(?:[^a-z]|$)/i
/** Shaft, curved arm and luminaire of street lights. Painted, not zinc. */
const LAMP_BLACK = /ecls_mat|ecls_tete|ecl_cross|cts_lamp|lampadaire|cand[eé]labre/i

function isPoleLabel(label: string) {
  return POLE_LABEL.test(label)
}

/** World-metre box projection so a texture tiles on cubes that shipped without UVs. */
function ensureWorldBoxUVs(mesh: THREE.Mesh, tileMeters = 0.38) {
  const geom = mesh.geometry
  const pos = geom.getAttribute('position')
  if (!pos) return
  if (!geom.getAttribute('normal')) geom.computeVertexNormals()
  const normal = geom.getAttribute('normal')
  if (!normal) return
  const uv = new Float32Array(pos.count * 2)
  mesh.updateWorldMatrix(true, false)
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
    n.fromBufferAttribute(normal, i).transformDirection(mesh.matrixWorld)
    const ax = Math.abs(n.x)
    const ay = Math.abs(n.y)
    const az = Math.abs(n.z)
    if (ay >= ax && ay >= az) {
      uv[i * 2] = v.x / tileMeters
      uv[i * 2 + 1] = v.z / tileMeters
    } else if (ax >= az) {
      uv[i * 2] = v.z / tileMeters
      uv[i * 2 + 1] = v.y / tileMeters
    } else {
      uv[i * 2] = v.x / tileMeters
      uv[i * 2 + 1] = v.y / tileMeters
    }
  }
  geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

function tunePoleMaterial(mat: THREE.MeshStandardMaterial, mesh: THREE.Mesh, label: string) {
  const next = mat.clone()
  if (LAMP_BLACK.test(label)) {
    next.map = null
    next.normalMap = null
    next.roughnessMap = null
    next.metalnessMap = null
    next.aoMap = null
    next.emissiveMap = null
    next.color.set('#1a1c1f')
    next.emissive.set('#000000')
    next.metalness = 0.08
    next.roughness = 0.55
    next.envMapIntensity = 0.3
    next.needsUpdate = true
    return next
  }
  // Socles in the ground stay cast concrete, never the zinc coat or black paint.
  if (/massif/i.test(label)) {
    next.metalness = 0.02
    next.roughness = Math.max(next.roughness || 0, 0.86)
    next.envMapIntensity = 0.28
    if (!next.map) next.color.set('#8c897f')
    next.needsUpdate = true
    return next
  }
  const missingUv = !hasUvAttribute(mesh)
  const missingMap = !next.map
  const bareGray = missingMap && next.color.r > 0.65 && next.color.g > 0.65 && next.color.b > 0.65
  if (bareGray) {
    mesh.geometry = mesh.geometry.clone()
    ensureWorldBoxUVs(mesh)
    next.map = galvanizedTexture()
    next.normalMap = null
    next.roughnessMap = null
    next.metalnessMap = null
    next.aoMap = null
    next.emissiveMap = null
    next.color.set('#ffffff')
    next.metalness = 0.32
    next.roughness = 0.74
  } else if (missingUv && next.map) {
    mesh.geometry = mesh.geometry.clone()
    ensureWorldBoxUVs(mesh)
    next.color.set('#ffffff')
    next.metalnessMap = null
    next.roughnessMap = null
    next.metalness = 0.16
    next.roughness = 0.84
  } else if (missingMap) {
    next.metalness = 0.28
    next.roughness = Math.max(next.roughness || 0, 0.62)
  } else {
    next.metalness = THREE.MathUtils.clamp(next.metalness || 0.45, 0.22, 0.62)
    next.roughness = Math.max(next.roughness || 0.4, 0.48)
  }
  next.envMapIntensity = 0.42
  next.needsUpdate = true
  return next
}

function tuneMaterial(source: THREE.Material, mesh: THREE.Mesh, anisotropy: number) {
  const mat = source as THREE.MeshStandardMaterial
  if (!mat || !('color' in mat)) return source

  applyAnisotropy(mat, anisotropy)

  const label = surfaceLabel(mat, mesh)

  if (isGrassLabel(label)) return mat

  if (isGlass(mat, mesh)) return toGlass()

  stabilizePhysical(mat)

  if (isPoleLabel(label)) return tunePoleMaterial(mat, mesh, label)

  // Ground grids under the canopies shipped with no material and read as black stripes.
  // Clone: the loader reuses one fallback material for every unauthored primitive.
  if (isBareMaterial(mat) && /^plane(\.\d+)?$/i.test(mesh.name)) {
    const ground = mat.clone()
    ground.name = 'canopy-ground'
    ground.color.set('#5c6168')
    ground.metalness = 0.04
    ground.roughness = 0.9
    ground.envMapIntensity = RENDER.ground.asphaltEnv
    ground.polygonOffset = true
    ground.polygonOffsetFactor = 1
    ground.polygonOffsetUnits = 1
    ground.needsUpdate = true
    return ground
  }

  // 1. Photovoltaic solar modules
  if (isPvModule(label)) {
    const s = RENDER.solar
    if (!mat.map) {
      mat.color.setRGB(s.color[0], s.color[1], s.color[2], THREE.SRGBColorSpace)
    }
    mat.roughness = s.roughness
    mat.metalness = s.metalness
    mat.envMapIntensity = s.envMapIntensity
    mat.needsUpdate = true
    return mat
  }

  // 2. Telecom towers, electrical infrastructure & technical enclosures
  if (/treillis|antenne|radio|parabole|mast|tower|poste|transformateur|onduleur|armoire|shelter|rack|switch|bess|grillage/i.test(label)) {
    const m = RENDER.metal
    mat.metalness = m.metalness
    mat.roughness = m.roughness
    mat.envMapIntensity = m.envMapIntensity
    mat.needsUpdate = true
    return mat
  }

  // 3. Vehicles & automotive gloss
  if (/vehicule|car|voiture|camion|truck|auto/i.test(label)) {
    if (/pneu|tire|wheel|roue|rubber/i.test(label)) {
      mat.roughness = 0.88
      mat.metalness = 0.02
      mat.envMapIntensity = 0.4
    } else {
      const v = RENDER.vehicle
      mat.roughness = v.roughness
      mat.metalness = v.metalness
      mat.envMapIntensity = v.envMapIntensity
    }
    mat.needsUpdate = true
    return mat
  }

  // 4. Foliage & Trees
  if (/tree|arbre|feuille|leaf|foliage|vegetation|plant|arbuste/i.test(label)) {
    mat.roughness = 0.65
    mat.metalness = 0.0
    mat.envMapIntensity = 0.5
    mat.side = THREE.DoubleSide
    mat.needsUpdate = true
    return mat
  }

  // 5. Standard Metals — galvanized / painted, not chrome
  if (/metal|acier|steel|alu|zinc|iron|fer/i.test(label)) {
    mat.metalness = Math.max(mat.metalness || 0, 0.72)
    mat.roughness = Math.max(Math.min(mat.roughness || 0.45, 0.55), 0.34)
    mat.envMapIntensity = Math.max(mat.envMapIntensity || 0, 1.25)
    mat.needsUpdate = true
    return mat
  }

  // Building shell ships as untextured near-white paint, shared with paving.
  // Clone so only the coque moves toward plaster; dallage keeps its albedo.
  if (
    !mat.map &&
    mat.color.r > 0.8 &&
    mat.color.g > 0.8 &&
    mat.color.b > 0.8 &&
    /coque_du_batiment/i.test(label)
  ) {
    const shell = mat.clone()
    shell.metalness = Math.min(shell.metalness || 0, 0.04)
    shell.roughness = Math.max(shell.roughness || 0, 0.82)
    shell.envMapIntensity = 0.32
    shell.color.multiplyScalar(0.74)
    shell.color.g *= 0.985
    shell.color.b *= 0.95
    shell.needsUpdate = true
    return shell
  }

  // 5b. Concrete and rendered walls — break the flat white CAD read
  if (/concrete|beton|béton|ciment|plaster|enduit|stucco|parpaing/i.test(label)) {
    mat.metalness = Math.min(mat.metalness || 0, 0.04)
    mat.roughness = Math.max(mat.roughness || 0, 0.82)
    mat.envMapIntensity = Math.min(mat.envMapIntensity || 0.32, 0.32)
    if (!mat.map && mat.color.r > 0.8 && mat.color.g > 0.8 && mat.color.b > 0.8) {
      mat.color.multiplyScalar(0.74)
      mat.color.g *= 0.985
      mat.color.b *= 0.95
    }
    mat.needsUpdate = true
    return mat
  }

  // 6. Generic dielectric materials
  mat.metalness = Math.min(mat.metalness || 0, 0.08)
  if ('envMapIntensity' in mat) {
    mat.envMapIntensity = Math.max(mat.envMapIntensity || 0, 0.85)
    mat.needsUpdate = true
  }
  return mat
}

function stabilizePhysical(mat: THREE.MeshStandardMaterial) {
  const physical = mat as THREE.MeshPhysicalMaterial
  if (!('transmission' in physical)) return
  physical.transmission = 0
  physical.thickness = 0
  physical.sheen = 0
  physical.iridescence = 0
  physical.anisotropy = 0
}

let glassMat: THREE.MeshPhysicalMaterial | null = null

function toGlass() {
  const g = RENDER.glass
  if (
    glassMat &&
    Math.abs((glassMat.userData.glassEnvFull ?? 0) - g.envMapIntensity) < 1e-6 &&
    Math.abs(glassMat.roughness - g.roughness) < 1e-6
  ) {
    return glassMat
  }
  glassMat = new THREE.MeshPhysicalMaterial({
    name: 'glass',
    color: new THREE.Color().setRGB(g.color[0], g.color[1], g.color[2], THREE.SRGBColorSpace),
    metalness: g.metalness,
    roughness: g.roughness,
    envMapIntensity: g.envMapIntensity,
    ior: g.ior,
    clearcoat: g.clearcoat,
    clearcoatRoughness: g.clearcoatRoughness,
    transmission: 0,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    side: THREE.FrontSide,
  })
  glassMat.userData.glass = true
  glassMat.userData.reflectiveGlass = true
  glassMat.userData.glassEnvFull = g.envMapIntensity
  glassMat.userData.glassRoughFull = g.roughness
  return glassMat
}

function applyAnisotropy(mat: THREE.MeshStandardMaterial, anisotropy: number) {
  const maps = [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.aoMap, mat.emissiveMap]
  for (const map of maps) {
    if (!map) continue
    map.anisotropy = anisotropy
    map.generateMipmaps = true
    map.minFilter = THREE.LinearMipmapLinearFilter
    map.magFilter = THREE.LinearFilter
    map.needsUpdate = true
  }
  if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace
  if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace
}

const GRASS_TILE_M = 4.5
/** Olive lawn tint — muted so it doesn't neon under AgX + grade. */
export const GRASS_COLOR = new THREE.Color(0.55, 0.64, 0.4)

type GrassMaps = {
  map: THREE.Texture
  normalMap: THREE.Texture | null
  roughnessMap: THREE.Texture | null
  aoMap: THREE.Texture | null
}

let grassMaps: GrassMaps | null = null

function wrapGrassTex(tex: THREE.Texture, aniso: number, color: boolean) {
  const next = tex.clone()
  next.wrapS = THREE.RepeatWrapping
  next.wrapT = THREE.RepeatWrapping
  next.repeat.set(1, 1)
  next.anisotropy = aniso
  next.generateMipmaps = true
  next.minFilter = THREE.LinearMipmapLinearFilter
  next.magFilter = THREE.LinearFilter
  next.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  next.needsUpdate = true
  return next
}

export async function applyCampusGrass(root: THREE.Object3D, anisotropy: number) {
  if (!grassMaps) {
    const loader = new THREE.TextureLoader()
    loader.setPath(`${import.meta.env.BASE_URL}models/grass/textures/`)
    const [map, normalMap, roughnessMap, aoMap] = await Promise.all([
      loader.loadAsync('Grass005_Color.jpg'),
      loader.loadAsync('Grass005_NormalGL.jpg').catch(() => null),
      loader.loadAsync('Grass005_Roughness.jpg').catch(() => null),
      loader.loadAsync('Grass005_AO.jpg').catch(() => null),
    ])
    map.colorSpace = THREE.SRGBColorSpace
    grassMaps = { map, normalMap, roughnessMap, aoMap }
  }

  const maps = grassMaps
  const v = new THREE.Vector3()

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const grassIdx = list
      .map((mat, i) => (isLawnMaterial(mat, mesh) ? i : -1))
      .filter((i) => i >= 0)
    if (!grassIdx.length && !isGrassLabel(mesh.name)) return

    const geom = mesh.geometry
    const pos = geom?.getAttribute('position')
    if (pos && !mesh.userData.grassWorldUv) {
      mesh.updateWorldMatrix(true, false)
      const uv = new Float32Array(pos.count * 2)
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
        uv[i * 2] = v.x / GRASS_TILE_M
        uv[i * 2 + 1] = -v.z / GRASS_TILE_M
      }
      geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      mesh.userData.grassWorldUv = true
    }

    const next = list.map((mat) => {
      const std = mat as THREE.MeshStandardMaterial
      if (!std?.isMeshStandardMaterial) return mat
      const hit =
        isLawnMaterial(std, mesh) ||
        (!grassIdx.length && isGrassLabel(mesh.name))
      if (!hit) return mat
      const grass = std.clone()
      grass.map = wrapGrassTex(maps.map, anisotropy, true)
      grass.normalMap = maps.normalMap ? wrapGrassTex(maps.normalMap, anisotropy, false) : null
      if (grass.normalMap) grass.normalScale.set(0.95, 0.95)
      grass.roughnessMap = maps.roughnessMap ? wrapGrassTex(maps.roughnessMap, anisotropy, false) : null
      grass.aoMap = maps.aoMap ? wrapGrassTex(maps.aoMap, anisotropy, false) : null
      grass.metalnessMap = null
      grass.color.copy(GRASS_COLOR)
      grass.metalness = 0
      grass.roughness = 0.88
      grass.envMapIntensity = RENDER.ground.envMapIntensity
      grass.polygonOffset = true
      grass.polygonOffsetFactor = -1
      grass.polygonOffsetUnits = -1
      grass.userData.canonicalGrass = true
      grass.needsUpdate = true
      return grass
    })
    mesh.material = Array.isArray(mesh.material) ? next : next[0]
    mesh.receiveShadow = true
    mesh.castShadow = false
    mesh.renderOrder = 3
  })
}

/** Procedural asphalt only when a mesh has no authored albedo (rare). */
const ASPHALT_TILE_M = 2.5

type AsphaltMaps = { map: THREE.CanvasTexture; normalMap: THREE.DataTexture; roughnessMap: THREE.DataTexture }
let asphaltMaps: AsphaltMaps | null = null
let asphaltMapsPending: Promise<AsphaltMaps> | null = null

function yieldFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

async function makeAsphaltMaps(aniso: number): Promise<AsphaltMaps> {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')

  ctx.fillStyle = '#222428'
  ctx.fillRect(0, 0, size, size)
  const imgData = ctx.getImageData(0, 0, size, size)
  const data = imgData.data

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const n1 = hash(x * 2.4 + y * 9.1, 2.1)
      const n2 = hash(x * 5.3 + y * 7.4, 5.7)
      const grain = n1 * 0.55 + n2 * 0.45 - 0.5
      const roll = (Math.sin(x * 0.02) * Math.cos(y * 0.018)) * 2
      let val = 38 + grain * 20 + roll
      val = Math.max(24, Math.min(58, Math.round(val)))
      data[idx] = val + 1
      data[idx + 1] = val
      data[idx + 2] = val - 1
      data[idx + 3] = 255
    }
    if ((y & 127) === 127) await yieldFrame()
  }

  for (let i = 0; i < 28000; i++) {
    const px = Math.floor(hash(i, 31) * size)
    const py = Math.floor(hash(i, 32) * size)
    const pIdx = (py * size + px) * 4
    const stoneType = hash(i, 33)
    const stoneVal =
      stoneType > 0.9 ? 62 + Math.floor(hash(i, 34) * 16) : stoneType < 0.12 ? 24 + Math.floor(hash(i, 35) * 6) : 40 + Math.floor(hash(i, 36) * 12)
    data[pIdx] = Math.round(data[pIdx]! * 0.4 + (stoneVal + 2) * 0.6)
    data[pIdx + 1] = Math.round(data[pIdx + 1]! * 0.4 + stoneVal * 0.6)
    data[pIdx + 2] = Math.round(data[pIdx + 2]! * 0.4 + (stoneVal - 1) * 0.6)
  }
  ctx.putImageData(imgData, 0, 0)
  await yieldFrame()

  const nData = new Uint8Array(size * size * 4)
  const rData = new Uint8Array(size * size * 4)
  const getLuma = (x: number, y: number) => {
    const i = (((y + size) % size) * size + ((x + size) % size)) * 4
    return (data[i]! * 0.2126 + data[i + 1]! * 0.7152 + data[i + 2]! * 0.0722) / 255
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = getLuma(x - 1, y - 1)
      const t = getLuma(x, y - 1)
      const tr = getLuma(x + 1, y - 1)
      const l = getLuma(x - 1, y)
      const r = getLuma(x + 1, y)
      const bl = getLuma(x - 1, y + 1)
      const b = getLuma(x, y + 1)
      const br = getLuma(x + 1, y + 1)
      const dX = tr + 2 * r + br - (tl + 2 * l + bl)
      const dY = bl + 2 * b + br - (tl + 2 * t + tr)
      const nx = -dX * 2.4
      const ny = -dY * 2.4
      const len = Math.sqrt(nx * nx + ny * ny + 1)
      const i = (y * size + x) * 4
      nData[i] = Math.round(((nx / len) * 0.5 + 0.5) * 255)
      nData[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255)
      nData[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255)
      nData[i + 3] = 255
      const rough = THREE.MathUtils.clamp(0.83 - (getLuma(x, y) - 0.15) * 0.2, 0.76, 0.9)
      const rByte = Math.round(rough * 255)
      rData[i] = rByte
      rData[i + 1] = rByte
      rData[i + 2] = rByte
      rData[i + 3] = 255
    }
    if ((y & 127) === 127) await yieldFrame()
  }

  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.anisotropy = aniso
  map.generateMipmaps = true
  map.minFilter = THREE.LinearMipmapLinearFilter
  map.magFilter = THREE.LinearFilter
  map.needsUpdate = true

  const normalMap = new THREE.DataTexture(nData, size, size, THREE.RGBAFormat)
  const roughnessMap = new THREE.DataTexture(rData, size, size, THREE.RGBAFormat)
  for (const tex of [normalMap, roughnessMap]) {
    tex.colorSpace = THREE.NoColorSpace
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.anisotropy = aniso
    tex.generateMipmaps = true
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.needsUpdate = true
  }
  return { map, normalMap, roughnessMap }
}

async function getAsphaltMaps(anisotropy: number) {
  if (asphaltMaps) return asphaltMaps
  asphaltMapsPending ??= makeAsphaltMaps(anisotropy).then((maps) => {
    asphaltMaps = maps
    asphaltMapsPending = null
    return maps
  })
  return asphaltMapsPending
}

/** Optional early bake — only used if a road has no authored albedo. */
export function prefetchCampusAsphalt(anisotropy: number) {
  void getAsphaltMaps(anisotropy)
}

function tuneAuthoredAsphalt(mat: THREE.MeshStandardMaterial, anisotropy: number) {
  const road = mat.clone()
  applyAnisotropy(road, anisotropy)
  if (road.map) road.map.colorSpace = THREE.SRGBColorSpace
  // Keep metallicRoughness maps; nudge response for sun sheen without chalk.
  if (!road.metalnessMap) road.metalness = 0.08
  if (!road.roughnessMap) road.roughness = 0.78
  else road.roughness = Math.min(road.roughness ?? 1, 0.82)
  if (road.normalMap) road.normalScale.set(0.9, 0.9)
  road.envMapIntensity = RENDER.ground.asphaltEnv
  road.polygonOffset = true
  road.polygonOffsetFactor = 1
  road.polygonOffsetUnits = 1
  road.userData.campusAsphalt = true
  stabilizePhysical(road)
  road.needsUpdate = true
  return road
}

async function tuneProceduralAsphalt(mat: THREE.MeshStandardMaterial, mesh: THREE.Mesh, anisotropy: number) {
  const maps = await getAsphaltMaps(anisotropy)
  if (!hasUvAttribute(mesh)) {
    // World-metre UVs only for untextured fallback (no KHR transform to fight).
    const geom = mesh.geometry
    const pos = geom.getAttribute('position')
    if (pos) {
      mesh.updateWorldMatrix(true, false)
      const uv = new Float32Array(pos.count * 2)
      const v = new THREE.Vector3()
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
        uv[i * 2] = v.x / ASPHALT_TILE_M
        uv[i * 2 + 1] = -v.z / ASPHALT_TILE_M
      }
      geom.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    }
  }
  const road = mat.clone()
  road.map = maps.map.clone()
  road.normalMap = maps.normalMap.clone()
  road.roughnessMap = maps.roughnessMap.clone()
  for (const tex of [road.map, road.normalMap, road.roughnessMap]) {
    if (!tex) continue
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 1)
    tex.anisotropy = anisotropy
    tex.needsUpdate = true
  }
  road.color.set('#ffffff')
  road.normalScale.set(0.6, 0.6)
  road.metalness = 0.08
  road.roughness = 0.78
  road.envMapIntensity = RENDER.ground.asphaltEnv
  road.polygonOffset = true
  road.polygonOffsetFactor = 1
  road.polygonOffsetUnits = 1
  road.userData.campusAsphalt = true
  road.needsUpdate = true
  return road
}

/**
 * Prefer Blender/KitBash asphalt (Plane.007 + "Asphalt" PBR). Procedural maps
 * are only a fallback when albedo is missing.
 */
export async function applyCampusAsphalt(root: THREE.Object3D, anisotropy: number) {
  const jobs: Array<Promise<void>> = []

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const meshLabel = `${mesh.name} ${mesh.parent?.name ?? ''}`
    if (isRoadMarking(meshLabel)) return

    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const asphaltIdx = list
      .map((mat, i) => {
        const label = `${mat?.name ?? ''} ${mesh.name}`.toLowerCase()
        if (isRoadMarking(label)) return -1
        return isAsphaltLabel(label) ? i : -1
      })
      .filter((i) => i >= 0)
    if (!asphaltIdx.length && !isAsphaltLabel(mesh.name.toLowerCase())) return

    jobs.push(
      (async () => {
        const next = await Promise.all(
          list.map(async (mat, i) => {
            const std = mat as THREE.MeshStandardMaterial
            if (!std?.isMeshStandardMaterial) return mat
            if (isRoadMarking(`${std.name} ${mesh.name}`)) return mat
            const hit =
              asphaltIdx.includes(i) ||
              (!asphaltIdx.length && isAsphaltLabel(mesh.name.toLowerCase()))
            if (!hit) return mat
            if (std.map || std.normalMap || std.roughnessMap) {
              return tuneAuthoredAsphalt(std, anisotropy)
            }
            return tuneProceduralAsphalt(std, mesh, anisotropy)
          }),
        )
        mesh.material = Array.isArray(mesh.material) ? next : next[0]
        mesh.receiveShadow = true
      })(),
    )
  })

  await Promise.all(jobs)
  applyRoadMarkings(root, anisotropy)
}

const markBox = new THREE.Box3()
const markInv = new THREE.Matrix4()
const markWorld = new THREE.Vector3()
const markLocal = new THREE.Vector3()

function localSpanY(mesh: THREE.Mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  const bb = mesh.geometry.boundingBox
  if (!bb) return 0
  return bb.max.y - bb.min.y
}

/** Parking-bay grids shipped as nameless extruded Plane meshes (about 18 cm tall). */
function isParkingBar(mesh: THREE.Mesh) {
  if (!/^plane(\.\d+)?$/i.test(mesh.name)) return false
  const h = localSpanY(mesh)
  return h > 0.02 && h < 0.45
}

function isPaintExtrusion(mesh: THREE.Mesh, mat: THREE.MeshStandardMaterial) {
  if (!mat?.isMeshStandardMaterial || !mat.color || mat.map || mat.normalMap) return false
  if (/trettoir|trottoir|dallage|bordure|sidewalk-curb|grass|herbe|asphalt|asphalte/i.test(`${mat.name} ${mesh.name}`)) {
    return false
  }
  const lum = (mat.color.r + mat.color.g + mat.color.b) / 3
  if (lum < 0.75) return false
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  const bb = mesh.geometry.boundingBox
  if (!bb) return false
  mesh.updateWorldMatrix(true, false)
  markBox.copy(bb).applyMatrix4(mesh.matrixWorld)
  const h = markBox.max.y - markBox.min.y
  const sx = markBox.max.x - markBox.min.x
  const sz = markBox.max.z - markBox.min.z
  if (h < 0.018 || h > 0.25) return false
  if (markBox.max.y > 1.6) return false
  return Math.max(sx, sz) > 0.6
}

/**
 * Extruded lane / bay paint becomes a single sheet on the mid-height of the
 * volume (where the bar met the asphalt). Side and bottom faces are dropped.
 */
function worldTriNy(pos: THREE.BufferAttribute, mesh: THREE.Mesh, ia: number, ib: number, ic: number) {
  triA.fromBufferAttribute(pos, ia).applyMatrix4(mesh.matrixWorld)
  triB.fromBufferAttribute(pos, ib).applyMatrix4(mesh.matrixWorld)
  triC.fromBufferAttribute(pos, ic).applyMatrix4(mesh.matrixWorld)
  triB.sub(triA)
  triC.sub(triA)
  triN.crossVectors(triB, triC)
  const len = triN.length() || 1
  return triN.y / len
}

function flattenMarkingGeometry(mesh: THREE.Mesh) {
  if (mesh.userData.markingFlat) return
  const source = mesh.geometry
  const srcPos = source.getAttribute('position') as THREE.BufferAttribute | undefined
  const srcIndex = source.getIndex()
  if (!srcPos || !srcIndex) return

  mesh.updateWorldMatrix(true, false)
  let upright = 0
  let flipped = 0
  for (let t = 0; t + 2 < srcIndex.count; t += 3) {
    const ny = worldTriNy(srcPos, mesh, srcIndex.getX(t), srcIndex.getX(t + 1), srcIndex.getX(t + 2))
    if (ny > 0.45) upright++
    else if (ny < -0.45) flipped++
  }
  const keepUp = upright >= flipped
  const groups = source.groups.length
    ? source.groups.slice()
    : [{ start: 0, count: srcIndex.count, materialIndex: 0 }]
  const kept: number[] = []
  const used = new Set<number>()
  const keptGroups: { start: number; count: number; materialIndex: number }[] = []
  for (const group of groups) {
    const start = kept.length
    const end = group.start + group.count
    for (let t = group.start; t + 2 < end; t += 3) {
      const ia = srcIndex.getX(t)
      const ib = srcIndex.getX(t + 1)
      const ic = srcIndex.getX(t + 2)
      const ny = worldTriNy(srcPos, mesh, ia, ib, ic)
      const top = keepUp ? ny > 0.45 : ny < -0.45
      if (!top) continue
      kept.push(ia, ib, ic)
      used.add(ia)
      used.add(ib)
      used.add(ic)
    }
    const count = kept.length - start
    if (count > 0) keptGroups.push({ start, count, materialIndex: group.materialIndex ?? 0 })
  }
  if (kept.length < 3) {
    mesh.userData.markingFlat = true
    return
  }

  const geom = source.clone()
  mesh.geometry = geom
  const pos = geom.getAttribute('position') as THREE.BufferAttribute
  markInv.copy(mesh.matrixWorld).invert()
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < pos.count; i++) {
    markWorld.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
    minY = Math.min(minY, markWorld.y)
    maxY = Math.max(maxY, markWorld.y)
  }
  const targetY = (minY + maxY) * 0.5 + 0.004
  for (const i of used) {
    markWorld.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
    markWorld.y = targetY
    markLocal.copy(markWorld).applyMatrix4(markInv)
    pos.setXYZ(i, markLocal.x, markLocal.y, markLocal.z)
  }
  geom.clearGroups()
  for (const group of keptGroups) geom.addGroup(group.start, group.count, group.materialIndex)
  geom.setIndex(kept)
  pos.needsUpdate = true
  geom.computeVertexNormals()
  geom.computeBoundingBox()
  geom.computeBoundingSphere()
  mesh.userData.markingFlat = true
}

/** Lane paint, crosswalks and parking bays — flat sheets, no extruded sides. */
export function applyRoadMarkings(root: THREE.Object3D, anisotropy: number) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || mesh.userData.markingFlat) return
    const meshLabel = `${mesh.name} ${mesh.parent?.name ?? ''}`
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const markingMesh = isRoadMarking(meshLabel)
    const markingMats = list.some((mat) => isRoadMarking(`${mat?.name ?? ''} ${mesh.name}`))
    const parkingBar = isParkingBar(mesh)
    const paintBar = list.some((mat) => isPaintExtrusion(mesh, mat as THREE.MeshStandardMaterial))
    if (!markingMesh && !markingMats && !parkingBar && !paintBar) return

    flattenMarkingGeometry(mesh)

    const next = list.map((mat) => {
      const std = mat as THREE.MeshStandardMaterial
      if (!std?.isMeshStandardMaterial) return mat
      const matLabel = `${std.name} ${mesh.name}`
      if (!markingMesh && !parkingBar && !paintBar && !isRoadMarking(matLabel)) return mat

      const paint = std.clone()
      applyAnisotropy(paint, anisotropy)
      paint.map = null
      paint.normalMap = null
      paint.roughnessMap = null
      paint.metalnessMap = null
      const keepHue = /rouge|vert|red|green|jaune|yellow/i.test(matLabel)
      if (!keepHue) paint.color.set('#f4f4f2')
      paint.metalness = 0
      paint.roughness = RENDER.ground.markingRoughness
      paint.envMapIntensity = 0.22
      paint.polygonOffset = true
      paint.polygonOffsetFactor = -2
      paint.polygonOffsetUnits = -2
      paint.depthWrite = true
      paint.userData.roadMarking = true
      stabilizePhysical(paint)
      paint.needsUpdate = true
      return paint
    })
    mesh.material = Array.isArray(mesh.material) ? next : next[0]
    mesh.renderOrder = 2
    mesh.castShadow = false
    mesh.receiveShadow = true
  })
}
