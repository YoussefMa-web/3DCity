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
  root.traverse((obj) => {
    if (obj.name === 'sky') return
    if (INTERIOR.test(obj.name)) obj.visible = false
  })
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
}

function isGlass(mat: THREE.MeshStandardMaterial, mesh: THREE.Mesh) {
  const label = `${mat.name} ${mesh.name} ${mesh.parent?.name ?? ''}`
  if (FRAME_NAME.test(label) && !GLASS_NAME.test(label)) return false
  if (GLASS_NAME.test(label)) return true
  const physical = mat as THREE.MeshPhysicalMaterial
  if ('transmission' in physical && physical.transmission > 0.25 && mat.roughness < 0.18) return true
  return Boolean(mat.transparent && mat.opacity < 0.25)
}

function tuneMaterial(source: THREE.Material, mesh: THREE.Mesh, anisotropy: number) {
  const mat = source as THREE.MeshStandardMaterial
  if (!mat || !('color' in mat)) return source

  applyAnisotropy(mat, anisotropy)

  const label = `${mat.name} ${mesh.name} ${mesh.parent?.name ?? ''}`.toLowerCase()

  if (isGrassLabel(label)) return mat

  if (isGlass(mat, mesh)) return toGlass()

  stabilizePhysical(mat)

  // 1. Photovoltaic solar modules
  if (/solar|panneau|photovolta|module_pv|cellule/i.test(label)) {
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
  if (/pylone|treillis|antenne|radio|parabole|mast|tower|poste|transformateur|onduleur|armoire|shelter|rack|switch|bess|candélabre|candelabre|grillage/i.test(label)) {
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

  // 5. Standard Metals
  if (/metal|acier|steel|alu|zinc|iron|fer/i.test(label)) {
    mat.metalness = Math.max(mat.metalness || 0, 0.88)
    mat.roughness = Math.min(mat.roughness || 0.4, 0.26)
    mat.envMapIntensity = Math.max(mat.envMapIntensity || 0, 2.2)
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

/** Lane paint & crosswalks — thin meshes; polygonOffset + semi-matte paint. */
export function applyRoadMarkings(root: THREE.Object3D, anisotropy: number) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const meshLabel = `${mesh.name} ${mesh.parent?.name ?? ''}`
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const markingMesh = isRoadMarking(meshLabel)
    const markingMats = list.some((mat) => isRoadMarking(`${mat?.name ?? ''} ${mesh.name}`))
    if (!markingMesh && !markingMats) return

    const next = list.map((mat) => {
      const std = mat as THREE.MeshStandardMaterial
      if (!std?.isMeshStandardMaterial) return mat
      if (!markingMesh && !isRoadMarking(`${std.name} ${mesh.name}`)) return mat

      const paint = std.clone()
      applyAnisotropy(paint, anisotropy)
      paint.map = null
      paint.normalMap = null
      paint.roughnessMap = null
      paint.metalnessMap = null
      // Off-white road paint — not pure #fff (blows out under AgX).
      if (/blanc|white|axiale|pieton|pi[eé]ton/i.test(`${std.name} ${mesh.name}`)) {
        paint.color.set('#e8eaed')
      }
      paint.metalness = 0
      paint.roughness = RENDER.ground.markingRoughness
      paint.envMapIntensity = 0.28
      paint.polygonOffset = true
      paint.polygonOffsetFactor = -1
      paint.polygonOffsetUnits = -1
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
