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
  exposure: 0.98,
  interiorExposure: 0.85,
  /**
   * Interactive stays under native retina so GTAO + soft shadows can stay on
   * every frame. Dropping them while orbiting was the flicker.
   */
  pixelRatioMax: hero ? 2 : 1.5,
  /** Geometric edges (rails, louvers, panel frames). SMAA alone cannot cover them. */
  msaaSamples: 4,
  anisotropyCap: 16,

  sun: {
    /** Warm daylight. High enough to feel like a clear morning, not sunset. */
    color: 0xfff4d4,
    intensity: 3.05,
    elevation: 0.52,
    azimuth: 0.28,
    /** Cool sky fill, kept weaker than the sun so façades keep their shape. */
    fillColor: 0xd7e7f6,
    fill: 0.2,
    hemiSky: 0xc5dff8,
    hemiGround: 0x7d8c46,
    hemi: 0.34,
    ambient: 0.05,
  },

  shadow: {
    mapSize: hero ? 4096 : 2048,
    radius: 1.5,
    bias: -0.00004,
    normalBias: 0.02,
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
    radius: 1.35,
    distanceExponent: 1.6,
    thickness: 1.1,
    scale: 1.4,
    samples: hero ? 16 : 8,
    distanceFallOff: 1.0,
    screenSpaceRadius: false,
    /** Constant contact shadows — never toggled off while the camera moves. */
    blendIntensity: hero ? 0.9 : 0.82,
    resolutionScale: hero ? 0.85 : 0.75,
    pd: {
      lumaPhi: 12,
      depthPhi: 2.4,
      normalPhi: 4,
      radius: 6,
      rings: 2,
      samples: 8,
    },
  },

  bloom: {
    strength: 0.028,
    radius: 0.24,
    threshold: 1.32,
  },

  fog: {
    nearScale: 1.2,
    farScale: 6.2,
    nearMin: 280,
    farMin: 1400,
    /** Soft horizon haze — sampled from HDRI when available. */
    color: [0.78, 0.86, 0.96] as const,
    keys: [
      { d: 18, near: 520, far: 1900 },
      { d: 55, near: 480, far: 1750 },
      { d: 120, near: 560, far: 1800 },
      { d: 200, near: 760, far: 1500 },
      { d: 380, near: 980, far: 1750 },
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
    color: [0.46, 0.58, 0.68] as const,
    roughness: 0.055,
    metalness: 0.18,
    envMapIntensity: 1.85,
    ior: 1.52,
    clearcoat: 0.55,
    clearcoatRoughness: 0.08,
  },

  solar: {
    color: [0.015, 0.04, 0.09] as const,
    roughness: 0.16,
    metalness: 0.48,
    envMapIntensity: 1.45,
  },

  metal: {
    roughness: 0.42,
    metalness: 0.72,
    envMapIntensity: 1.35,
  },

  vehicle: {
    roughness: 0.1,
    metalness: 0.8,
    envMapIntensity: 2.7,
  },

  grade: {
    vignette: 0.028,
    grain: 0.008,
    aberration: 0,
    /** Slight cool lift — pulls the orange cast back without cloning the old grade. */
    lift: [-0.008, -0.006, -0.002] as const,
    gain: [1.02, 1.02, 1.0] as const,
    saturation: 1.1,
    contrast: 1.2,
    /** Unsharp mask after SMAA brings back edge shimmer. Keep it off. */
    sharpness: 0,
    sCurve: 0.3,
  },

  groundMacro: {
    colorAmount: 0.09,
    roughnessAmount: 0.09,
  },

  ground: {
    /** Tiny IBL — enough for form, not a blue plastic disc. */
    envMapIntensity: 0.22,
    asphaltEnv: 0.72,
    markingRoughness: 0.58,
  },
} as const
