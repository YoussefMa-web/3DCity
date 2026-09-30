import * as THREE from 'three'

type AnyMaterial = THREE.Material & {
  clippingPlanes?: THREE.Plane[] | null
  clipShadows?: boolean
}

interface CutSession {
  roots: THREE.Object3D[]
  plane: THREE.Plane
  originals: Map<THREE.Mesh, THREE.Material | THREE.Material[]>
}

/** Horizontal cut on one building only. Materials are cloned so shared GLB materials stay intact. */
export class Cutaway {
  private session: CutSession | null = null
  private readonly cloneCache = new WeakMap<THREE.Material, AnyMaterial>()

  constructor(renderer: THREE.WebGLRenderer) {
    renderer.localClippingEnabled = true
  }

  get active() {
    return this.session !== null
  }

  apply(roots: THREE.Object3D[], heightY: number, include: (mesh: THREE.Mesh) => boolean) {
    const same =
      this.session &&
      this.session.roots.length === roots.length &&
      roots.every((root, index) => root === this.session!.roots[index])
    if (same && this.session) {
      this.session.plane.constant = heightY
      return
    }
    this.clear()
    if (!roots.length) return

    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), heightY)
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()
    for (const root of roots) {
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh || !mesh.material || !include(mesh)) return
        originals.set(mesh, mesh.material)
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((material) => this.cut(material, plane))
          : this.cut(mesh.material, plane)
      })
    }
    this.session = { roots, plane, originals }
  }

  clear() {
    if (!this.session) return
    for (const [mesh, material] of this.session.originals) mesh.material = material
    this.session = null
  }

  private cut(material: THREE.Material, plane: THREE.Plane): AnyMaterial {
    let clone = this.cloneCache.get(material)
    if (!clone) {
      clone = material.clone() as AnyMaterial
      clone.side = THREE.DoubleSide
      clone.clipShadows = true
      this.cloneCache.set(material, clone)
    }
    clone.clippingPlanes = [plane]
    clone.needsUpdate = true
    return clone
  }
}
