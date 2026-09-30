import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface CameraShot {
  position: THREE.Vector3
  target: THREE.Vector3
  fov?: number
  minDistance?: number
  maxDistance?: number
}

export class CameraDirector {
  private animating = false
  private readonly fromPos = new THREE.Vector3()
  private readonly fromTarget = new THREE.Vector3()
  private readonly toPos = new THREE.Vector3()
  private readonly toTarget = new THREE.Vector3()
  private readonly midPos = new THREE.Vector3()
  private readonly arcA = new THREE.Vector3()
  private readonly arcB = new THREE.Vector3()
  private fromFov = 48
  private toFov = 48
  private t = 0
  private duration = 1.4
  private onDone: (() => void) | null = null

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly controls: OrbitControls,
  ) {}

  get busy() {
    return this.animating
  }

  flyTo(shot: CameraShot, duration = 1.4, onDone?: () => void) {
    this.fromPos.copy(this.camera.position)
    this.fromTarget.copy(this.controls.target)
    this.toPos.copy(shot.position)
    this.toTarget.copy(shot.target)
    this.fromFov = this.camera.fov
    this.toFov = shot.fov ?? this.camera.fov
    this.t = 0
    this.duration = duration
    this.animating = true
    this.onDone = onDone ?? null

    const dist = this.fromPos.distanceTo(this.toPos)
    this.midPos.copy(this.fromPos).lerp(this.toPos, 0.5)
    this.midPos.y += Math.min(28, dist * 0.14)

    if (shot.minDistance != null) this.controls.minDistance = shot.minDistance
    if (shot.maxDistance != null) this.controls.maxDistance = shot.maxDistance
  }

  cancel() {
    this.animating = false
    this.onDone = null
  }

  update(dt: number) {
    if (!this.animating) return
    this.t += dt / this.duration
    const k = easeInOutCubic(Math.min(1, this.t))
    this.arcA.copy(this.fromPos).lerp(this.midPos, k)
    this.arcB.copy(this.midPos).lerp(this.toPos, k)
    this.camera.position.copy(this.arcA).lerp(this.arcB, k)
    this.controls.target.lerpVectors(this.fromTarget, this.toTarget, k)
    if (this.fromFov !== this.toFov) {
      this.camera.fov = THREE.MathUtils.lerp(this.fromFov, this.toFov, k)
      this.camera.updateProjectionMatrix()
    }
    this.controls.update()
    if (this.t < 1) return

    this.animating = false
    this.camera.position.copy(this.toPos)
    this.controls.target.copy(this.toTarget)
    this.camera.fov = this.toFov
    this.camera.updateProjectionMatrix()
    this.controls.update()
    const done = this.onDone
    this.onDone = null
    done?.()
  }
}

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
