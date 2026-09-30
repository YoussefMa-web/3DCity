import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { RENDER } from './RenderSettings'

const FilmGradeShader = {
  name: 'FilmGradeShader',
  uniforms: {
    tDiffuse: { value: null },
    contrast: { value: 1.12 },
    saturation: { value: 1.22 },
    vignette: { value: 0.07 },
    brightness: { value: 0.0 },
    lift: { value: new THREE.Vector3(-0.008, -0.004, 0.004) },
    gain: { value: new THREE.Vector3(1.04, 1.03, 1.02) },
    sharpness: { value: 0.22 },
    grain: { value: 0.0015 },
    sCurve: { value: 0.28 },
    resolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float contrast;
    uniform float saturation;
    uniform float vignette;
    uniform float brightness;
    uniform vec3 lift;
    uniform vec3 gain;
    uniform float sharpness;
    uniform float grain;
    uniform float sCurve;
    uniform vec2 resolution;
    varying vec2 vUv;

    float luma(vec3 c) {
      return dot(c, vec3(0.2126, 0.7152, 0.0722));
    }

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 col = tex.rgb;

      if (sharpness > 0.0001) {
        vec2 px = 1.0 / max(resolution, vec2(1.0));
        vec3 blur = (
          texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb +
          texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb +
          texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb +
          texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb
        ) * 0.25;
        col += (col - blur) * sharpness;
      }

      col = (col - 0.5) * contrast + 0.5 + brightness;

      float y = luma(col);
      col = mix(vec3(y), col, saturation);

      col = col * gain + lift;

      if (sCurve > 0.0001) {
        vec3 bent = col * col * (3.0 - 2.0 * col);
        col = mix(col, bent, sCurve);
      }

      vec2 coord = (vUv - 0.5) * 2.0;
      float dist = dot(coord, coord);
      col *= clamp(1.0 - dist * vignette, 0.0, 1.0);

      if (grain > 0.00001) {
        float n = hash12(vUv * resolution) - 0.5;
        col += n * grain;
      }

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), tex.a);
    }
  `,
}

export class PostProcessing {
  readonly composer: EffectComposer
  private readonly renderPass: RenderPass
  private readonly gtaoPass: GTAOPass
  private readonly bloomPass: UnrealBloomPass
  private readonly smaaPass: SMAAPass
  private readonly outputPass: OutputPass
  private readonly gradePass: ShaderPass

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
  ) {
    const width = window.innerWidth
    const height = window.innerHeight
    const pr = renderer.getPixelRatio()

    const rt = new THREE.WebGLRenderTarget(width * pr, height * pr, {
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    })

    this.composer = new EffectComposer(renderer, rt)

    this.renderPass = new RenderPass(scene, camera)
    this.composer.addPass(this.renderPass)

    const aoScale = RENDER.ao.resolutionScale
    this.gtaoPass = new GTAOPass(scene, camera, Math.round(width * aoScale), Math.round(height * aoScale))
    this.gtaoPass.output = GTAOPass.OUTPUT.Default
    this.gtaoPass.blendIntensity = RENDER.ao.blendIntensity
    this.gtaoPass.updateGtaoMaterial({
      radius: RENDER.ao.radius,
      distanceExponent: RENDER.ao.distanceExponent,
      thickness: RENDER.ao.thickness,
      scale: RENDER.ao.scale,
      samples: RENDER.ao.samples,
      distanceFallOff: RENDER.ao.distanceFallOff,
      screenSpaceRadius: RENDER.ao.screenSpaceRadius,
    })
    this.gtaoPass.updatePdMaterial(RENDER.ao.pd)
    this.composer.addPass(this.gtaoPass)

    const bloom = RENDER.bloom
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width * pr, height * pr),
      bloom.strength,
      bloom.radius,
      bloom.threshold,
    )
    this.composer.addPass(this.bloomPass)

    this.smaaPass = new SMAAPass()
    this.smaaPass.setSize(width * pr, height * pr)
    this.composer.addPass(this.smaaPass)

    this.outputPass = new OutputPass()
    this.composer.addPass(this.outputPass)

    this.gradePass = new ShaderPass(FilmGradeShader)
    const grade = RENDER.grade
    this.gradePass.uniforms.contrast.value = grade.contrast
    this.gradePass.uniforms.saturation.value = grade.saturation
    this.gradePass.uniforms.vignette.value = grade.vignette
    this.gradePass.uniforms.lift.value.set(...grade.lift)
    this.gradePass.uniforms.gain.value.set(...grade.gain)
    this.gradePass.uniforms.sharpness.value = grade.sharpness
    this.gradePass.uniforms.grain.value = grade.grain
    this.gradePass.uniforms.sCurve.value = grade.sCurve
    this.gradePass.uniforms.resolution.value.set(width * pr, height * pr)
    this.composer.addPass(this.gradePass)
  }

  setSize(width: number, height: number) {
    const pr = this.renderer.getPixelRatio()
    const aoScale = RENDER.ao.resolutionScale
    this.composer.setSize(width, height)
    this.composer.setPixelRatio(pr)
    this.gtaoPass.setSize(Math.round(width * aoScale), Math.round(height * aoScale))
    this.bloomPass.setSize(width * pr, height * pr)
    this.smaaPass.setSize(width * pr, height * pr)
    this.gradePass.uniforms.resolution.value.set(width * pr, height * pr)
  }

  setMoving(isMoving: boolean) {
    // Contact AO and bloom are the expensive passes. Drop both while the
    // camera flies or orbits, then restore the settled look.
    this.gtaoPass.enabled = !isMoving
    this.bloomPass.enabled = !isMoving
    if (!isMoving) {
      this.gtaoPass.blendIntensity = RENDER.ao.blendIntensity
      this.gtaoPass.updateGtaoMaterial({ samples: RENDER.ao.samples })
      this.bloomPass.strength = RENDER.bloom.strength
      this.bloomPass.radius = RENDER.bloom.radius
      this.bloomPass.threshold = RENDER.bloom.threshold
    }
  }

  render() {
    this.composer.render()
  }
}
