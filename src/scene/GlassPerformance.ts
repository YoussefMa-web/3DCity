import * as THREE from 'three'
import { RENDER } from './RenderSettings'

/**
 * Adaptive reflective glass: full HDRI response when the camera is settled /
 * close; lighter sampling while orbiting or looking from far.
 *
 * Materials stay MeshStandard reflective glass (same tint / metalness) —
 * only envMapIntensity + roughness ease. Looks like glass the whole time;
 * full sparkle returns as soon as motion stops.
 */
export class GlassPerformance {
  private readonly registered = new Set<THREE.MeshStandardMaterial>()
  private readonly materials: THREE.MeshStandardMaterial[] = []
  private mode: 'full' | 'motion' | 'far' = 'full'
  private settleAt = 0

  collect(root: THREE.Object3D) {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      let glassOnly = mats.length > 0
      for (const mat of mats) {
        if (!mat) {
          glassOnly = false
          continue
        }
        const std = mat as THREE.MeshStandardMaterial
        const name = (std.name || '').toLowerCase()
        const meshName = (mesh.name || '').toLowerCase()
        const isGlass =
          std.userData?.reflectiveGlass === true ||
          /glass|verre|vitre|window|fenetre|glazing|facade_glass|curtainwall|baie|darkblue|vitrage/i.test(name) ||
          /glass|window|vitrage|curtain/i.test(meshName)

        if (!isGlass) {
          glassOnly = false
          continue
        }
        if (this.registered.has(std)) continue
        this.registered.add(std)

        // Upgrade flat dark/black textureless window materials to premium reflective glass.
        // Was tinting these near-black (0x0a1420) — a dark base color multiplies
        // reflected light down no matter how high envMapIntensity goes, which is
        // exactly what read as "dead, no reflection" glass. Use the same
        // near-neutral tint as the primary glass path so it can actually
        // show a bright reflection.
        if (std.userData.glassEnvFull == null) {
          const g = RENDER.glass
          std.color = new THREE.Color().setRGB(g.color[0], g.color[1], g.color[2], THREE.SRGBColorSpace)
          std.roughness = g.roughness
          std.metalness = g.metalness
          std.envMapIntensity = g.envMapIntensity
          const physical = std as THREE.MeshPhysicalMaterial
          if ('clearcoat' in physical) {
            physical.clearcoat = g.clearcoat
            physical.clearcoatRoughness = g.clearcoatRoughness
            physical.ior = g.ior
          }
          std.userData.glassEnvFull = g.envMapIntensity
          std.userData.glassRoughFull = g.roughness
          std.userData.reflectiveGlass = true
          std.needsUpdate = true
        }
        this.materials.push(std)
      }
      // Opaque reflective glass must cast so façades throw a solid shadow
      if (glassOnly) {
        mesh.userData.glassFacade = true
        mesh.castShadow = true
      }
    })
  }

  /**
   * @param moving — user drag / fly / orbit in progress
   * @param orbitDist — camera ↔ controls target distance (m)
   * @param nowMs — performance.now()
   */
  update(moving: boolean, orbitDist: number, nowMs: number) {
    if (moving) {
      this.settleAt = nowMs + 320
      this.apply('motion')
      return
    }
    if (nowMs < this.settleAt) {
      this.apply('motion')
      return
    }
    // Far aerial: still reflective, slightly softer IBL (fill-rate win on towers).
    this.apply(orbitDist > 120 ? 'far' : 'full')
  }

  private apply(next: 'full' | 'motion' | 'far') {
    if (next === this.mode) return
    this.mode = next

    const fullEnv = RENDER.glass.envMapIntensity
    const fullRough = RENDER.glass.roughness

    for (const mat of this.materials) {
      const baseEnv = (mat.userData.glassEnvFull as number) ?? fullEnv
      const baseRough = (mat.userData.glassRoughFull as number) ?? fullRough
      if (next === 'full') {
        mat.envMapIntensity = baseEnv
        mat.roughness = baseRough
      } else if (next === 'far') {
        // Aerial still needs readable sky reflections on curtain walls.
        mat.envMapIntensity = Math.min(baseEnv, 4.8)
        mat.roughness = Math.max(baseRough, 0.025)
      } else {
        mat.envMapIntensity = Math.min(baseEnv, 3.8)
        mat.roughness = Math.max(baseRough, 0.04)
      }
    }
  }

  get stats() {
    return { count: this.materials.length, mode: this.mode }
  }
}
