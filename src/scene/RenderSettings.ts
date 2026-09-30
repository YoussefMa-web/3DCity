/**
 * Single place to tune the cinematic realism pass.
 * URL `?quality=hero` raises DPR, AO, and shadows for stills/demos.
 */

export type QualityMode = 'interactive' | 'hero'

export function resolveQualityMode(raw?: string | null): QualityMode {
  return raw?.toLowerCase() === 'hero' ? 'hero' : 'interactive'
}

export const QUALITY: QualityMode =
  typeof location !== 'undefined' ? resolveQualityMode(new URLSearchParams(location.search).get('quality')) : 'interactive'

const hero = QUALITY === 'hero'

export const RENDER = {
  /** AgX holds architectural whites better than ACES (softer highlight rolloff). */
  exposure: 1.06,
  interiorExposure: 0.85,
  /** Cap DPR — Retina at 2× forces near-4K fullscreen GTAO/bloom every frame. */
  pixelRatioMax: hero ? 2 : 1.75,
  msaaSamples: 0,
  anisotropyCap: 16,

  sun: {
    /** Neutral daylight key — warm enough for façades, without the orange cast. */
    color: 0xfff6e6,
    intensity: 2.9,
    elevation: 0.52,
    azimuth: 0.22,
    /** Cool-neutral fill. A fully blue fill greys the concrete. */
    fillColor: 0xe6eef6,
    fill: 0.34,
    hemiSky: 0xf3f6fb,
    hemiGround: 0x7d8868,
    hemi: 0.46,
    ambient: 0.09,
  },

  shadow: {
    mapSize: hero ? 4096 : 2048,
    radius: 2.0,
    bias: -0.000035,
    normalBias: 0.032,
    cameraNear: 8,
    cameraFar: 2200,
    focusMin: 48,
    focusMax: 420,
    focusDistanceScale: 1.65,
    /** Larger thresholds = fewer shadow-map rebuilds while panning/zooming. */
    moveThreshold: 18,
    extentThreshold: 24,
    /** Extra shadowMap.needsUpdate frames after boot / orbit end. */
    settleBakeFrames: 8,
  },

  ao: {
    radius: 2.2,
    distanceExponent: 1.6,
    thickness: 1.4,
    scale: 1.12,
    samples: hero ? 16 : 10,
    distanceFallOff: 1.0,
    screenSpaceRadius: false,
    /** Softer contact shadows — full samples only once the camera settles. */
    blendIntensity: hero ? 0.82 : 0.72,
    resolutionScale: hero ? 0.85 : 0.7,
    pd: {
      lumaPhi: 10,
      depthPhi: 2,
      normalPhi: 3,
      radius: 5,
      rings: 2,
      samples: 10,
    },
  },

  bloom: {
    strength: 0.032,
    radius: 0.22,
    threshold: 1.38,
  },

  fog: {
    nearScale: 1.2,
    farScale: 6.2,
    nearMin: 160,
    farMin: 780,
    /** Soft horizon haze — sampled from HDRI when available. */
    color: [0.9, 0.925, 0.95] as const,
    keys: [
      { d: 18, near: 380, far: 1400 },
      { d: 55, near: 340, far: 1250 },
      { d: 120, near: 420, far: 1450 },
      { d: 200, near: 560, far: 1650 },
      { d: 380, near: 720, far: 1900 },
    ] as const,
    follow: 4.2,
  },

  perf: {
    warmupMs: 2500,
    discardFrames: 60,
    windowSize: 90,
    hitchMs: 250,
    stableFrameMs: 50,
    p75Ms: 36,
    meanMs: 32,
    cooldownMs: 4500,
  },

  glass: {
    /** Architectural glass: dark dielectric that still shows HDRI specular. */
    color: [0.02, 0.055, 0.1] as const,
    roughness: 0.02,
    metalness: 0.05,
    envMapIntensity: 5.8,
    ior: 1.52,
    clearcoat: 1.0,
    clearcoatRoughness: 0.015,
  },

  solar: {
    color: [0.02, 0.05, 0.11] as const,
    roughness: 0.09,
    metalness: 0.22,
    envMapIntensity: 2.85,
  },

  metal: {
    roughness: 0.2,
    metalness: 0.94,
    envMapIntensity: 2.55,
  },

  vehicle: {
    roughness: 0.1,
    metalness: 0.8,
    envMapIntensity: 2.7,
  },

  grade: {
    vignette: 0.055,
    grain: 0.0012,
    aberration: 0,
    /** Slight cool lift — pulls the orange cast back without cloning the old grade. */
    lift: [0.002, 0.001, 0.006] as const,
    gain: [1.02, 1.025, 1.03] as const,
    saturation: 1.12,
    contrast: 1.08,
    sharpness: 0.14,
    sCurve: 0.2,
  },

  groundMacro: {
    colorAmount: 0.09,
    roughnessAmount: 0.09,
  },

  ground: {
    /** Tiny IBL — enough for form, not a blue plastic disc. */
    envMapIntensity: 0.18,
    asphaltEnv: 0.72,
    markingRoughness: 0.58,
  },
} as const
