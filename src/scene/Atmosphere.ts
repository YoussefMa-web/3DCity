import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { RENDER } from './RenderSettings'
import {
  brightestUpperDirection,
  DEFAULT_HDRI_ID,
  hdriPreset,
  horizonBandColor,
  resolveHdriId,
  yawToAlign,
  type HdriId,
} from './HdriCatalog'

const GROUND_MIST = 0xf0ebe0

/**
 * Clean studio daylight — matches Blender maquette reference shots
 * (bright, neutral, vivid materials, strong glass reflections).
 * HDRI drives both IBL and the visible background (same rotation).
 */
export class Atmosphere {
  readonly sun = new THREE.DirectionalLight(RENDER.sun.color, RENDER.sun.intensity)
  readonly fill = new THREE.DirectionalLight(RENDER.sun.fillColor, RENDER.sun.fill)
  readonly hemi = new THREE.HemisphereLight(RENDER.sun.hemiSky, RENDER.sun.hemiGround, RENDER.sun.hemi)
  readonly ambient = new THREE.AmbientLight(0xffffff, RENDER.sun.ambient)
  private readonly sunDir = new THREE.Vector3()
  private readonly shadowFocus = new THREE.Vector3()
  private shadowExtent = 0
  private readonly scene: THREE.Scene
  private readonly pmrem: THREE.PMREMGenerator
  private sky: Sky | null = null
  private envMap: THREE.Texture | null = null
  private skyBg: THREE.Texture | null = null
  private hdriBackground: THREE.Texture | null = null
  private readonly hdriCache = new Map<HdriId, THREE.Texture>()
  private activeHdri: HdriId = DEFAULT_HDRI_ID
  private hdriYaw = 0
  private hdriPeak: ReturnType<typeof brightestUpperDirection> = null
  private hdriHorizon: THREE.Color | null = null
  private readonly skyReady: Promise<boolean>
  hazeColor = new THREE.Color(GROUND_MIST)
  private fogNear = 150
  private fogFar = 900
  /** Soft practical light dedicated to interior inspection — off outdoors. */
  private readonly interiorFill = new THREE.HemisphereLight(0xf4f6f9, 0x1a1d22, 0)
  private interiorState: {
    background: THREE.Texture | THREE.Color | null
    environmentIntensity: number
    fog: THREE.Fog | THREE.FogExp2 | null
    sun: number
    fill: number
    hemi: number
    ambient: number
  } | null = null

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.pmrem = new THREE.PMREMGenerator(renderer)
    this.pmrem.compileEquirectangularShader()

    this.skyBg = this.makeStudioBackground()
    this.scene.background = this.skyBg
    this.scene.fog = null

    this.sky = new Sky()
    this.sky.scale.setScalar(4500)
    this.sky.frustumCulled = false
    this.sky.userData.decoy = true
    this.sky.raycast = () => {}
    const u = this.sky.material.uniforms
    u.turbidity.value = 1.6
    u.rayleigh.value = 1.0
    u.mieCoefficient.value = 0.003
    u.mieDirectionalG.value = 0.8
    this.scene.add(this.sky)

    this.setSun(RENDER.sun.elevation, RENDER.sun.azimuth)

    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(RENDER.shadow.mapSize, RENDER.shadow.mapSize)
    this.sun.shadow.bias = RENDER.shadow.bias
    this.sun.shadow.normalBias = RENDER.shadow.normalBias
    // r185 PCF ignores radius (PCFSoft was rewritten to PCF). Harmless no-op.
    this.sun.shadow.camera.near = RENDER.shadow.cameraNear
    this.sun.shadow.camera.far = RENDER.shadow.cameraFar
    this.setShadowExtent(320)
    this.scene.add(this.sun)
    this.scene.add(this.sun.target)

    this.fill.position.set(-120, 100, 150)
    this.scene.add(this.fill)
    this.scene.add(this.fill.target)
    this.scene.add(this.hemi)
    this.scene.add(this.ambient)
    this.scene.add(this.interiorFill)

    this.refreshEnvFromSky()
    const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null
    this.activeHdri = resolveHdriId(params?.get('hdri'))
    this.skyReady = this.setHdri(this.activeHdri)
    void this.loadReflectionEnvironment()
  }

  /**
   * Glass/metal reflections come from `scene.environment`, deliberately kept
   * separate from the visible sky background. A pure-sky HDRI is the right
   * choice for the background (no baked-in ground content to clash with —
   * see setHdri), but reflecting nothing but flat sky reads as "dead" glass.
   * This loads a richer, real-structure HDRI (parking/urban) purely as a
   * reflection source — it's never displayed directly, only ever blurred
   * into specular highlights, so its own ground content is irrelevant here.
   */
  private async loadReflectionEnvironment(): Promise<void> {
    const url = `${import.meta.env.BASE_URL}hdri/abandoned_parking_2k.hdr`
    try {
      const hdr = await new RGBELoader().loadAsync(url)
      hdr.mapping = THREE.EquirectangularReflectionMapping
      hdr.colorSpace = THREE.LinearSRGBColorSpace
      const peak = brightestUpperDirection(hdr)
      const env = this.pmrem.fromEquirectangular(hdr).texture
      hdr.dispose()
      if (this.envMap) this.envMap.dispose()
      this.envMap = env
      this.scene.environment = env
      this.scene.environmentIntensity = 1.45
      if (peak) {
        this.scene.environmentRotation.set(0, yawToAlign(this.sunDir, peak.dir), 0)
      }
      console.info('[atmosphere] reflection env', url)
    } catch (err) {
      console.warn('[atmosphere] reflection env failed, falling back to procedural sky', url, err)
      this.refreshEnvFromSky()
    }
  }

  whenSkyReady() {
    return this.skyReady
  }

  setSun(elevation: number, azimuth: number) {
    const phi = THREE.MathUtils.degToRad(90 - elevation * 90)
    const theta = THREE.MathUtils.degToRad(azimuth * 360 - 90)
    this.sunDir.setFromSphericalCoords(1, phi, theta)
    this.sun.position.copy(this.sunDir).multiplyScalar(620)
    if (this.sky) this.sky.material.uniforms.sunPosition.value.copy(this.sunDir)
  }

  setShadowExtent(halfExtent: number) {
    const h = THREE.MathUtils.clamp(halfExtent, 32, 420)
    const cam = this.sun.shadow.camera
    cam.left = -h
    cam.right = h
    cam.top = h
    cam.bottom = -h
    cam.updateProjectionMatrix()
  }

  setCampusFog(center: THREE.Vector3, campusRadius: number) {
    if (this.hdriHorizon) {
      this.hazeColor
        .copy(this.hdriHorizon)
        .lerp(new THREE.Color().setRGB(...RENDER.fog.color, THREE.SRGBColorSpace), 0.35)
    } else {
      this.hazeColor.setRGB(...RENDER.fog.color, THREE.SRGBColorSpace)
    }
    // Seed from a typical overview distance; tick() then follows the camera.
    const range = fogRangeForDistance(180)
    this.fogNear = range.near
    this.fogFar = range.far
    if (!(this.scene.fog instanceof THREE.Fog)) {
      this.scene.fog = new THREE.Fog(this.hazeColor.clone(), this.fogNear, this.fogFar)
    } else {
      this.scene.fog.near = this.fogNear
      this.scene.fog.far = this.fogFar
      this.scene.fog.color.copy(this.hazeColor)
    }

    // Fog color is sampled live from the active HDRI's horizon band (see
    // horizonBandColor) so it always matches the visible sky background,
    // whichever HDRI preset is active — no more hand-tuned hex guesses.
    this.applyMaskedBackground()

    this.fill.position.copy(center).add(new THREE.Vector3(-120, 100, 150))
    this.fill.target.position.copy(center)
    this.fill.target.updateMatrixWorld()
    this.updateFocusedShadows(center, campusRadius * 0.9, true)
  }

  /**
   * Camera-distance fog: close villa ≈ none, street = slight mid fade,
   * aerial = stronger far-site depth. Exponential follow — no hard jumps.
   */
  updateViewFog(cameraDistance: number, dt: number) {
    if (this.interiorState) return
    const fog = this.scene.fog
    if (!(fog instanceof THREE.Fog)) return
    const target = fogRangeForDistance(cameraDistance)
    const follow = 1 - Math.exp(-Math.max(0, dt) * RENDER.fog.follow)
    this.fogNear += (target.near - this.fogNear) * follow
    this.fogFar += (target.far - this.fogFar) * follow
    fog.near = this.fogNear
    fog.far = this.fogFar
    fog.color.copy(this.hazeColor)
  }

  get fogRange() {
    return { near: this.fogNear, far: this.fogFar }
  }

  /**
   * Tighten the sun ortho around the current look-at so close-ups get
   * centimetre-scale shadow texels instead of a campus-wide 2048 map.
   * Returns true when the frustum changed (caller should flag shadowMap.needsUpdate).
   */
  updateFocusedShadows(focus: THREE.Vector3, cameraDistance: number, force = false) {
    const extent = THREE.MathUtils.clamp(
      cameraDistance * RENDER.shadow.focusDistanceScale,
      RENDER.shadow.focusMin,
      RENDER.shadow.focusMax,
    )
    const moved = this.shadowFocus.distanceToSquared(focus) > RENDER.shadow.moveThreshold ** 2
    const zoomed = Math.abs(extent - this.shadowExtent) > RENDER.shadow.extentThreshold
    if (!force && !moved && !zoomed) return false

    this.shadowFocus.copy(focus)
    this.shadowExtent = extent
    this.setShadowExtent(extent)
    const reach = Math.max(420, extent * 3.1)
    this.sun.position.copy(this.sunDir).multiplyScalar(reach).add(focus)
    this.sun.target.position.copy(focus)
    this.sun.target.updateMatrixWorld()
    return true
  }

  get sunDirection() {
    return this.sunDir
  }

  getShadowStats() {
    const cam = this.sun.shadow.camera
    const half = Math.max(cam.right, -cam.left)
    const range = cam.far - cam.near
    const biasMeters = Math.abs(this.sun.shadow.bias) * range
    const mapSize = this.sun.shadow.mapSize.x
    return {
      mapSize,
      halfExtent: +half.toFixed(2),
      metersPerTexel: +((half * 2) / mapSize).toFixed(4),
      bias: this.sun.shadow.bias,
      biasMeters: +biasMeters.toFixed(4),
      normalBias: this.sun.shadow.normalBias,
      cameraNear: cam.near,
      cameraFar: cam.far,
      sunPosition: this.sun.position.toArray().map((v) => +Number(v).toFixed(2)),
      sunTarget: this.sun.target.position.toArray().map((v) => +Number(v).toFixed(2)),
      sunDir: this.sunDir.toArray().map((v) => +Number(v).toFixed(4)),
      elevationDeg: +(RENDER.sun.elevation * 90).toFixed(2),
      azimuthDeg: +(RENDER.sun.azimuth * 360 - 90).toFixed(2),
    }
  }

  /**
   * Isolate lighting for interiors.
   * - `room`: closed ops floor (NOC) — dark bg, soft fill
   * - `cutaway`: outdoor roof cut (DC / BESS) — keep sky/HDRI to avoid black flashes
   */
  enterInteriorMode(mode: 'room' | 'cutaway' = 'room') {
    if (this.interiorState) return
    this.interiorState = {
      background: this.scene.background,
      environmentIntensity: this.scene.environmentIntensity,
      fog: this.scene.fog,
      sun: this.sun.intensity,
      fill: this.fill.intensity,
      hemi: this.hemi.intensity,
      ambient: this.ambient.intensity,
    }
    if (mode === 'room') {
      this.scene.background = new THREE.Color(0x0a0e14)
      this.scene.environmentIntensity = 0.12
      this.scene.fog = null
      this.sun.intensity = 0.55
      this.fill.intensity = 0.35
      this.hemi.intensity = 0.2
      this.ambient.intensity = 0.22
      this.interiorFill.intensity = 0.6
    } else {
      // Cutaway still outdoors — dim sun slightly, keep sky
      this.scene.fog = null
      this.sun.intensity = Math.min(this.sun.intensity, 1.35)
      this.fill.intensity = Math.max(this.fill.intensity, 0.35)
      this.hemi.intensity = Math.max(this.hemi.intensity, 0.4)
      this.ambient.intensity = Math.max(this.ambient.intensity, 0.12)
      this.interiorFill.intensity = 0.25
    }
  }

  exitInteriorMode() {
    if (!this.interiorState) return
    const s = this.interiorState
    this.scene.background = s.background
    this.scene.environmentIntensity = s.environmentIntensity
    // Restore outdoor fog without wiping color/range — recreate if something cleared it.
    if (s.fog) {
      this.scene.fog = s.fog
      if (s.fog instanceof THREE.Fog) {
        s.fog.color.copy(this.hazeColor)
        s.fog.near = this.fogNear
        s.fog.far = this.fogFar
      }
    } else if (!(this.scene.fog instanceof THREE.Fog)) {
      this.scene.fog = new THREE.Fog(this.hazeColor.clone(), this.fogNear, this.fogFar)
    }
    this.sun.intensity = s.sun
    this.fill.intensity = s.fill
    this.hemi.intensity = s.hemi
    this.ambient.intensity = s.ambient
    this.interiorFill.intensity = 0
    this.interiorState = null
    this.applyMaskedBackground()
  }

  /**
   * The flat 2D gradient (skyBg) is a screen-space texture: THREE fits it to
   * the viewport by comparing texture aspect (portrait, ~1:64) to screen
   * aspect, so how much of its vertical range actually lands on screen
   * shifts with window aspect ratio — a flat band sized for one aspect
   * ratio can compress to nothing at another, reintroducing the seam.
   *
   * Both the procedural Sky dome and an equirectangular HDRI compute color
   * per view-direction (dome: shader math every pixel; HDRI: real texel
   * lookup), so either meets the fogged ground at the true geometric
   * horizon from any camera angle or screen aspect, by construction.
   * HDRI is preferred by default now that fog color is sampled live from
   * its own horizon band (see horizonBandColor) — real photographed/rendered
   * sky, clouds included, instead of the clear procedural gradient.
   */
  private applyMaskedBackground() {
    const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null
    const forceProceduralSky = params?.has('proceduralsky')
    const forceFlatBg = params?.has('flatbg')

    if (forceFlatBg && this.skyBg) {
      this.scene.background = this.skyBg
      if (this.sky) this.sky.visible = false
    } else if (!forceProceduralSky && this.hdriBackground) {
      this.scene.background = this.hdriBackground
      if (this.sky) this.sky.visible = false
    } else if (this.sky) {
      this.sky.visible = true
      this.scene.background = null
    }
  }

  private makeStudioBackground() {
    const w = 4
    const h = 256
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    const grad = ctx.createLinearGradient(0, h, 0, 0)
    // Clean daylight sky from luminous horizon to rich daylight blue zenith.
    // This 2D texture is stretched over the FULL screen height regardless of
    // where the 3D ground's horizon actually lands on screen (that varies
    // with camera pitch/zoom) — so the bottom flat band must stay wide
    // enough to cover typical framings, not just the very last pixel row.
    // That flat band's color must stay in sync with RENDER.fog.color, or
    // the fogged ground shows a visible seam against this texture.
    grad.addColorStop(0, '#f2ece0')
    grad.addColorStop(0.4, '#efe8d8')
    grad.addColorStop(0.62, '#d4e4f2')
    grad.addColorStop(0.85, '#7fb0e0')
    grad.addColorStop(1, '#3a78c0')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    this.hazeColor.setRGB(0.93, 0.91, 0.84, THREE.SRGBColorSpace)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearFilter
    tex.needsUpdate = true
    return tex
  }

  /**
   * Per-preset env/bg intensity is HDRI dynamic-range normalization.
   * Directional sun intensity and AgX exposure are not changed here.
   */
  async setHdri(id: HdriId): Promise<boolean> {
    const preset = hdriPreset(id)
    try {
      let hdr = this.hdriCache.get(id) ?? null
      if (!hdr) {
        const isExr = preset.url.toLowerCase().endsWith('.exr')
        hdr = isExr
          ? await new EXRLoader().loadAsync(preset.url)
          : await new RGBELoader().loadAsync(preset.url)
        hdr.mapping = THREE.EquirectangularReflectionMapping
        hdr.colorSpace = THREE.LinearSRGBColorSpace
        this.hdriCache.set(id, hdr)
      }

      // Use this sky HDRI for IBL until/unless the richer reflection map loads.
      // Previously the PMREM result was disposed immediately — glass stayed on a
      // weak procedural env and read as matte plastic.
      const skyEnv = this.pmrem.fromEquirectangular(hdr).texture
      if (!this.envMap) {
        this.envMap = skyEnv
        this.scene.environment = skyEnv
        this.scene.environmentIntensity = Math.max(1.15, preset.env * 2.2)
      } else {
        skyEnv.dispose()
      }

      this.hdriBackground = hdr
      // Soften distant lower detail — real-photo HDRIs can carry ground-level
      // terrain baked in that reads at the wrong scale next to our campus.
      this.scene.backgroundIntensity = preset.bg
      this.scene.backgroundBlurriness = 0
      this.activeHdri = id

      this.hdriPeak = brightestUpperDirection(hdr)
      this.hdriHorizon = horizonBandColor(hdr)
      if (this.hdriHorizon) {
        // Warm the sampled horizon slightly — pure-sky HDRIs often read cold grey.
        this.hazeColor.copy(this.hdriHorizon).lerp(new THREE.Color().setRGB(...RENDER.fog.color, THREE.SRGBColorSpace), 0.35)
      }
      this.hdriYaw = 0
      if (preset.alignSun && this.hdriPeak) {
        this.hdriYaw = yawToAlign(this.sunDir, this.hdriPeak.dir)
        this.scene.backgroundRotation.set(0, this.hdriYaw, 0)
      } else {
        this.scene.backgroundRotation.set(0, 0, 0)
      }

      if (this.scene.fog instanceof THREE.Fog && this.hdriHorizon) {
        this.scene.fog.color.copy(this.hdriHorizon)
      }
      this.applyMaskedBackground()
      console.info(
        '[atmosphere] HDRI',
        preset.file,
        'env',
        preset.env,
        'bg',
        preset.bg,
        'yawDeg',
        +THREE.MathUtils.radToDeg(this.hdriYaw).toFixed(1),
        this.hdriPeak
          ? `peakL=${this.hdriPeak.luma.toFixed(0)} el=${this.hdriPeak.elevationDeg.toFixed(1)}`
          : '',
      )
      return true
    } catch (err) {
      console.warn('[atmosphere] HDRI failed', preset.url, err)
      if (id !== 'campus') return this.setHdri('campus')
      this.applyMaskedBackground()
      return false
    }
  }

  get hdriState() {
    const preset = hdriPreset(this.activeHdri)
    const peak = this.hdriPeak
    const rot = new THREE.Matrix4().makeRotationFromEuler(this.scene.environmentRotation)
    const worldPeak = peak ? peak.dir.clone().applyMatrix4(rot.clone().invert()) : null
    return {
      id: this.activeHdri,
      file: preset.file,
      env: this.scene.environmentIntensity,
      bg: this.scene.backgroundIntensity,
      yawDeg: +THREE.MathUtils.radToDeg(this.hdriYaw).toFixed(2),
      alignSun: preset.alignSun,
      peak: peak
        ? {
            luma: +peak.luma.toFixed(1),
            elevationDeg: +peak.elevationDeg.toFixed(1),
            azimuthDeg: +peak.azimuthDeg.toFixed(1),
            dir: peak.dir.toArray().map((v) => +v.toFixed(4)),
            size: peak.size,
          }
        : null,
      sunDir: this.sunDir.toArray().map((v) => +v.toFixed(4)),
      alignedPeakDir: worldPeak ? worldPeak.toArray().map((v) => +v.toFixed(4)) : null,
      alignedDotSun: worldPeak ? +worldPeak.dot(this.sunDir).toFixed(3) : null,
    }
  }

  refreshEnvFromSky() {
    if (!this.sky) return
    const holder = new THREE.Scene()
    const showSun = this.sky.material.uniforms.showSunDisc
    const prev = showSun ? showSun.value : null
    if (showSun) showSun.value = false
    holder.add(this.sky)
    const env = this.pmrem.fromScene(holder, 0.04).texture
    holder.remove(this.sky)
    this.scene.add(this.sky)
    if (showSun && prev !== null) showSun.value = prev
    if (this.envMap) this.envMap.dispose()
    this.envMap = env
    this.scene.environment = env
    this.scene.environmentIntensity = 1.22
  }
}

/**
 * Linear fog range from camera-to-target distance.
 * Near is lifted past the subject so close architecture never greys out.
 * Far is kept tight enough that the countryside ring edge dissolves into sky haze.
 */
function fogRangeForDistance(distance: number) {
  const keys = RENDER.fog.keys
  const lo = keys[0]!
  const hi = keys[keys.length - 1]!
  const x = THREE.MathUtils.clamp(distance, lo.d, hi.d)
  let i = 0
  while (i < keys.length - 2 && x > keys[i + 1]!.d) i++
  const a = keys[i]!
  const b = keys[i + 1]!
  const u = THREE.MathUtils.smoothstep(x, a.d, b.d)
  let near = THREE.MathUtils.lerp(a.near, b.near, u)
  let far = THREE.MathUtils.lerp(a.far, b.far, u)
  near = Math.max(near, RENDER.fog.nearMin, distance * 1.85 + 40)
  far = Math.max(far, RENDER.fog.farMin, near + 420)
  // Aerial views: pull fog in so the countryside edge melts into the sky.
  if (distance > 120) {
    far = Math.min(far, 1550 + distance * 0.85)
    near = Math.min(near, far - 380)
  }
  return { near, far }
}
