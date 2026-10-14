import * as THREE from 'three'
import { isInteriorName } from './look'

/**
 * The dark tower's irregular lines are the metal window frames drawn on top
 * of the glass, not a depth fight and not a texture filter.
 *
 * At ~160 m the frame's shortest edges cover about 3 pixels, so the grid
 * aliases. Hiding those frames — shadows and post-processing still on —
 * leaves a clean glass façade. At ~20 m the same frames cover ~20 pixels
 * and read correctly, so they stay.
 *
 * Frames fade out under 3.35 px and return above 4.8 px. The glass sibling
 * is never removed, so the silhouette and the window read remain.
 */

const HIDE_PX = 3.35
const SHOW_PX = 4.8
const MIN_TRIS = 500

interface Entry {
  mesh: THREE.Mesh
  minEdge: number
  center: THREE.Vector3
  fade: number
  showingDetail: boolean
  castShadow: boolean
  materials: THREE.Material[]
}

export class FacadeLod {
  private readonly entries: Entry[] = []
  private readonly viewSize = new THREE.Vector2()
  private prepared = false

  get stats() {
    let detailTris = 0
    for (const entry of this.entries) detailTris += triangleCount(entry.mesh.geometry)
    return { frames: this.entries.length, detailTris }
  }

  prepare(root: THREE.Object3D, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    if (this.prepared) return
    this.prepared = true

    const meshes: THREE.Mesh[] = []
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.geometry || !mesh.visible) return
      if (mesh.userData.decoy) return
      if (isInteriorName(mesh.name) || isInteriorName(mesh.parent?.name ?? '')) return
      if (triangleCount(mesh.geometry) < MIN_TRIS) return
      meshes.push(mesh)
    })

    const info = new Map<THREE.Mesh, MeshInfo>()
    for (const mesh of meshes) {
      const measured = measure(mesh)
      if (measured) info.set(mesh, measured)
    }

    for (const mesh of meshes) {
      const measured = info.get(mesh)
      if (!measured || measured.minEdge > 0.55 || isGlassMesh(mesh)) continue
      if (!isFrameOverlay(mesh, measured, info)) continue

      const materials = cloneMaterials(mesh)
      mesh.material = materials.length === 1 ? materials[0]! : materials
      this.entries.push({
        mesh,
        minEdge: Math.max(measured.minEdge, 0.001),
        center: measured.center,
        fade: 1,
        showingDetail: true,
        castShadow: mesh.castShadow,
        materials,
      })
    }

    this.update(camera, renderer, 1)
    console.info('[facade-lod] frames', this.stats.frames, 'tris', this.stats.detailTris)
  }

  update(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, dt: number) {
    if (!this.entries.length) return
    const height = renderer.getDrawingBufferSize(this.viewSize).y
    const pxPerMeter = height / (2 * Math.tan((camera.fov * Math.PI) / 360))
    const follow = 1 - Math.exp(-Math.max(0, dt) * 8)

    for (const entry of this.entries) {
      const dist = Math.max(0.75, camera.position.distanceTo(entry.center))
      const px = (entry.minEdge * pxPerMeter) / dist
      const limit = entry.showingDetail ? HIDE_PX : SHOW_PX
      entry.showingDetail = px >= limit
      const goal = entry.showingDetail ? 1 : 0
      entry.fade += (goal - entry.fade) * (dt >= 1 ? 1 : follow)
      this.apply(entry)
    }
  }

  private apply(entry: Entry) {
    const mesh = entry.mesh
    if (entry.fade <= 0.025) {
      mesh.visible = false
      mesh.castShadow = false
      return
    }
    mesh.visible = true
    const opaque = entry.fade >= 0.97
    mesh.castShadow = entry.castShadow && opaque
    for (const material of entry.materials) {
      material.opacity = THREE.MathUtils.clamp(entry.fade, 0, 1)
      material.depthWrite = opaque
      if (material.transparent === opaque) {
        material.transparent = !opaque
        material.needsUpdate = true
      }
    }
  }
}

interface MeshInfo {
  minEdge: number
  maxDim: number
  center: THREE.Vector3
  box: THREE.Box3
}

function triangleCount(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute('position')
  if (!position) return 0
  return (geometry.index ? geometry.index.count : position.count) / 3
}

function isGlassMesh(mesh: THREE.Mesh) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  return materials.some((material) => material?.userData?.glass === true || material?.userData?.reflectiveGlass === true)
}

function isFrameOverlay(mesh: THREE.Mesh, measured: MeshInfo, info: Map<THREE.Mesh, MeshInfo>) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  const material = materials[0] as THREE.MeshStandardMaterial | undefined
  const metal = (material?.metalness ?? 0) >= 0.5 || /metal|frame|mullion|frit|bronze/i.test(material?.name ?? '')
  const size = measured.box.getSize(new THREE.Vector3())
  const dims = [size.x, size.y, size.z].sort((a, b) => a - b)
  const thin = dims[0]! < Math.max(0.45, dims[2]! * 0.08)
  if (!(metal || (thin && measured.minEdge < 0.05))) return false

  const parent = mesh.parent
  if (!parent) return false
  for (const sibling of parent.children) {
    const other = sibling as THREE.Mesh
    if (other === mesh || !other.isMesh || !isGlassMesh(other)) continue
    const glass = info.get(other)
    if (!glass || glass.maxDim < measured.maxDim * 0.45) continue
    if (overlapRatio(measured.box, glass.box) < 0.35) continue
    return true
  }
  return false
}

function overlapRatio(detail: THREE.Box3, shell: THREE.Box3) {
  const hit = detail.clone().intersect(shell)
  if (hit.isEmpty()) return 0
  const size = new THREE.Vector3()
  const hole = new THREE.Vector3()
  detail.getSize(size)
  hit.getSize(hole)
  const volume = Math.max(1e-4, size.x * size.y * size.z)
  return (hole.x * hole.y * hole.z) / volume
}

function measure(mesh: THREE.Mesh): MeshInfo | null {
  const geometry = mesh.geometry
  const position = geometry.getAttribute('position')
  if (!position) return null
  const index = geometry.index
  const tris = triangleCount(geometry)
  mesh.updateWorldMatrix(true, false)
  const matrix = mesh.matrixWorld
  // Golden-ratio picks. A fixed stride follows triangle order and can
  // report a whole façade as "thin" because its small edges are grouped.
  const samples = Math.min(400, Math.floor(tris))
  const mins: number[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (let i = 0; i < samples; i++) {
    const tri = Math.floor(((i * 0.618033988749895) % 1) * tris)
    const i0 = index ? index.getX(tri * 3) : tri * 3
    const i1 = index ? index.getX(tri * 3 + 1) : tri * 3 + 1
    const i2 = index ? index.getX(tri * 3 + 2) : tri * 3 + 2
    a.fromBufferAttribute(position, i0).applyMatrix4(matrix)
    b.fromBufferAttribute(position, i1).applyMatrix4(matrix)
    c.fromBufferAttribute(position, i2).applyMatrix4(matrix)
    mins.push(Math.min(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)))
  }
  if (!mins.length) return null
  mins.sort((left, right) => left - right)
  if (!geometry.boundingBox) geometry.computeBoundingBox()
  const box = geometry.boundingBox!.clone().applyMatrix4(matrix)
  const size = box.getSize(new THREE.Vector3())
  return {
    minEdge: mins[mins.length >> 1] ?? 0,
    maxDim: Math.max(size.x, size.y, size.z),
    center: box.getCenter(new THREE.Vector3()),
    box,
  }
}

function cloneMaterials(mesh: THREE.Mesh) {
  const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  return source.map((material) => material.clone())
}
