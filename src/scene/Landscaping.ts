import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Maintained planting on the pasture just outside the campus pad.
 * Instanced, so a few dozen trees and shrubs are one draw each.
 * Nothing is placed on the footprint, the roads, or the solar field.
 */

const GREENS = [
  new THREE.Color(0.09, 0.16, 0.035),
  new THREE.Color(0.06, 0.12, 0.028),
  new THREE.Color(0.13, 0.18, 0.04),
  new THREE.Color(0.16, 0.15, 0.04),
]
const SHADE = new THREE.Color(0.035, 0.07, 0.02)
const BARK = [
  new THREE.Color(0.22, 0.14, 0.08),
  new THREE.Color(0.16, 0.1, 0.06),
  new THREE.Color(0.28, 0.18, 0.1),
]

type HeightAt = (dx: number, dz: number, worldX: number, worldZ: number, campusR: number) => number

export function addEdgePlanting(
  ground: THREE.Mesh,
  campusR: number,
  centerX: number,
  centerZ: number,
  heightAt: HeightAt,
) {
  const trees = [
    ...place(campusR, centerX, centerZ, heightAt, 28, 8, 58, 0.92, 3.4, 5.6),
    ...groves(campusR, centerX, centerZ, heightAt),
  ]
  const shrubs = place(campusR, centerX, centerZ, heightAt, 56, 5, 36, 0.88, 1.3, 2.4)
  if (!trees.length) return

  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.32, 2.2, 7)
  trunkGeo.translate(0, 1.05, 0)
  const canopyGeo = buildCrown()
  const shadeGeo = crownLobe(1.05, 0, 2.25, 0, 0.58, 11)
  shadeGeo.computeVertexNormals()
  const shrubGeo = buildShrub()

  const trunkMat = new THREE.MeshStandardMaterial({
    name: 'edge-trunk',
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0,
    envMapIntensity: 0.12,
  })
  const leafMat = new THREE.MeshStandardMaterial({
    name: 'edge-canopy',
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0,
    envMapIntensity: 0.28,
  })
  const shadeMat = new THREE.MeshStandardMaterial({
    name: 'edge-canopy-shade',
    color: SHADE,
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.08,
  })

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, trees.length)
  const canopy = new THREE.InstancedMesh(canopyGeo, leafMat, trees.length)
  const shade = new THREE.InstancedMesh(shadeGeo, shadeMat, trees.length)
  const bush = new THREE.InstancedMesh(shrubGeo, leafMat, Math.max(1, shrubs.length))
  fill(trunks, trees, 0.9, BARK)
  fill(canopy, trees, 1, GREENS)
  fill(shade, trees, 0.92, null)
  if (shrubs.length) fill(bush, shrubs, 1, GREENS)

  const group = new THREE.Group()
  group.name = 'edge-planting'
  group.add(trunks, shade, canopy)
  if (shrubs.length) group.add(bush)
  for (const mesh of [trunks, canopy, bush]) {
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = true
    mesh.computeBoundingSphere()
  }
  shade.castShadow = false
  shade.receiveShadow = true
  shade.frustumCulled = true
  shade.computeBoundingSphere()
  ground.add(group)
}

interface Spot {
  x: number
  y: number
  z: number
  scale: number
  yaw: number
  color: number
}

function place(
  campusR: number,
  centerX: number,
  centerZ: number,
  heightAt: HeightAt,
  count: number,
  inner: number,
  outer: number,
  keep: number,
  scaleMin: number,
  scaleMax: number,
) {
  const spots: Spot[] = []
  for (let i = 0; i < count; i++) {
    const n = hash(i, count)
    if (n > keep) continue
    const angle = (i / count) * Math.PI * 2 + (hash(i, 3) - 0.5) * 0.45
    const radius = campusR + inner + hash(i, 9) * (outer - inner)
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const y = heightAt(x, z, x + centerX, z + centerZ, campusR)
    spots.push({
      x,
      y,
      z,
      scale: scaleMin + hash(i, 5) * (scaleMax - scaleMin),
      yaw: hash(i, 7) * Math.PI * 2,
      color: Math.floor(hash(i, 11) * GREENS.length),
    })
  }
  return spots
}

/** A few angle-clustered groves so the rim reads as planting, not a dotted ring. */
function groves(campusR: number, centerX: number, centerZ: number, heightAt: HeightAt) {
  const spots: Spot[] = []
  const clusters = 6
  for (let c = 0; c < clusters; c++) {
    const base = (c / clusters) * Math.PI * 2 + 0.35
    const cr = campusR + 12 + hash(c, 2) * 22
    const cx = Math.cos(base) * cr
    const cz = Math.sin(base) * cr
    for (let k = 0; k < 5; k++) {
      const a = base + (hash(c, k + 4) - 0.5) * 0.7
      const r = 4 + hash(k, c + 8) * 11
      const x = cx + Math.cos(a) * r
      const z = cz + Math.sin(a) * r
      if (Math.hypot(x, z) < campusR + 4) continue
      const y = heightAt(x, z, x + centerX, z + centerZ, campusR)
      spots.push({
        x,
        y,
        z,
        scale: 4.2 + hash(c * 5 + k, 6) * 2.2,
        yaw: hash(k, c + 1) * Math.PI * 2,
        color: Math.floor(hash(c + 2, k + 3) * GREENS.length),
      })
    }
  }
  return spots
}

function fill(mesh: THREE.InstancedMesh, spots: Spot[], scaleMul: number, palette: THREE.Color[] | null) {
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()
  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i]!
    dummy.position.set(spot.x, spot.y, spot.z)
    dummy.rotation.set(0, spot.yaw, (hash(i, 13) - 0.5) * 0.08)
    const slim = 0.82 + hash(i, 17) * 0.36
    dummy.scale.set(spot.scale * scaleMul * slim, spot.scale * scaleMul, spot.scale * scaleMul / slim)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    if (palette) {
      color.copy(palette[spot.color % palette.length] ?? palette[0]!)
      mesh.setColorAt(i, color)
    }
  }
  mesh.instanceMatrix.needsUpdate = true
  if (palette && mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.count = spots.length
}

/** Several overlapping lobes so a crown has depth instead of one faceted ball. */
function crownLobe(radius: number, x: number, y: number, z: number, squash: number, seed: number) {
  const geo = new THREE.IcosahedronGeometry(1, 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const wobble = 0.78 + hash(i, seed) * 0.4
    pos.setXYZ(
      i,
      pos.getX(i) * radius * wobble,
      pos.getY(i) * radius * wobble * squash,
      pos.getZ(i) * radius * wobble,
    )
  }
  geo.translate(x, y, z)
  return geo
}

function buildCrown() {
  const parts = [
    crownLobe(1.4, 0, 2.65, 0, 0.7, 1),
    crownLobe(1.0, 0.9, 2.3, 0.15, 0.64, 2),
    crownLobe(0.92, -0.75, 2.4, -0.3, 0.68, 3),
    crownLobe(0.62, 0.1, 3.4, 0.05, 0.78, 4),
  ]
  const merged = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  if (!merged) return parts[0]!
  merged.computeVertexNormals()
  return merged
}

function buildShrub() {
  const parts = [
    crownLobe(0.7, 0, 0.45, 0, 0.55, 5),
    crownLobe(0.45, 0.35, 0.35, 0.1, 0.5, 6),
    crownLobe(0.4, -0.28, 0.32, -0.12, 0.5, 7),
  ]
  const merged = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  if (!merged) return parts[0]!
  merged.computeVertexNormals()
  return merged
}

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
