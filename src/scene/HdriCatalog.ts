import * as THREE from 'three'

export type HdriId = 'campus' | 'clear' | 'clouds' | 'puresky'

export type HdriPreset = {
  id: HdriId
  file: string
  url: string
  label: string
  /** IBL scale — HDRI-normalization only, not scene exposure. */
  env: number
  bg: number
  /** Rotate env/background so the HDRI sun disc matches the directional key. */
  alignSun: boolean
}

/**
 * On-disk HDRIs. Intensities compensate for map dynamic range so AgX/exposure
 * stay untouched. `clouds` is the production default (see Atmosphere).
 */
export const HDRI_PRESETS: readonly HdriPreset[] = [
  {
    id: 'campus',
    file: 'campus_hdri.hdr',
    url: `${import.meta.env.BASE_URL}hdri/campus_hdri.hdr`,
    label: 'campus 1K (previous)',
    env: 0.46,
    bg: 0.62,
    alignSun: false,
  },
  {
    id: 'clear',
    file: 'sky_clear_blue_2k.hdr',
    url: `${import.meta.env.BASE_URL}hdri/sky_clear_blue_2k.hdr`,
    label: 'clear blue 2K (production)',
    env: 0.4,
    bg: 0.62,
    alignSun: true,
  },
  {
    id: 'clouds',
    file: 'sky_clouds_2k.hdr',
    url: `${import.meta.env.BASE_URL}hdri/sky_clouds_2k.hdr`,
    label: 'Daylight Vivid Clouds 2K',
    env: 0.68,
    bg: 0.92,
    alignSun: true,
  },
  {
    id: 'puresky',
    file: 'kloofendal_puresky_2k.hdr',
    url: `${import.meta.env.BASE_URL}hdri/kloofendal_puresky_2k.hdr`,
    label: 'Kloofendal partly-cloudy pure sky 2K',
    env: 0.62,
    bg: 0.88,
    alignSun: true,
  },
]

/**
 * `clouds` (Daylight dynamic cumulus clouds) provides a vivid, vibrant
 * blue sky with crisp, bright cloud formations for rich architectural depth.
 */
export const DEFAULT_HDRI_ID: HdriId = 'clouds'

export function resolveHdriId(raw: string | null | undefined): HdriId {
  const id = (raw || '').toLowerCase()
  if (
    id === 'campus' ||
    id === 'clear' ||
    id === 'clouds' ||
    id === 'puresky'
  )
    return id
  return DEFAULT_HDRI_ID
}

export function hdriPreset(id: HdriId) {
  return HDRI_PRESETS.find((p) => p.id === id) ?? HDRI_PRESETS.find((p) => p.id === DEFAULT_HDRI_ID)!
}

/**
 * Brightest texel in the upper hemisphere, as a world direction using
 * Three.js `equirectUv` (u = atan(z,x)/2π+0.5, v = asin(y)/π+0.5).
 * Assumes HDRLoader/EXRLoader flipY (first image row = top = v=1).
 */
export function brightestUpperDirection(tex: THREE.Texture) {
  const img = tex.image as {
    data?: Float32Array | Uint16Array | Uint8Array
    width?: number
    height?: number
  }
  const w = img?.width ?? 0
  const h = img?.height ?? 0
  const data = img?.data
  if (!w || !h || !data) return null

  const channels = Math.max(3, Math.round(data.length / (w * h)))
  const half = tex.type === THREE.HalfFloatType
  const isByte = data instanceof Uint8Array && tex.type === THREE.UnsignedByteType
  const sample = (i: number) => {
    const v = data[i] ?? 0
    if (half) return THREE.DataUtils.fromHalfFloat(v)
    return v
  }
  let best = -1
  let bx = 0
  let by = 0
  const step = Math.max(1, Math.floor(Math.min(w, h) / 256))
  for (let y = 0; y < h; y += step) {
    const v = 1 - (y + 0.5) / h
    if (v < 0.52) continue
    for (let x = 0; x < w; x += step) {
      const o = (y * w + x) * channels
      let r = sample(o)
      let g = sample(o + 1)
      let b = sample(o + 2)
      if (isByte) {
        const e = data[o + 3] ?? 0
        if (!e) continue
        const f = 2 ** (e - 128 - 8)
        r *= f
        g *= f
        b *= f
      }
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
      if (luma > best) {
        best = luma
        bx = x
        by = y
      }
    }
  }
  if (best < 0) return null
  const u = (bx + 0.5) / w
  const v = 1 - (by + 0.5) / h
  const theta = (u - 0.5) * Math.PI * 2
  const sy = Math.sin((v - 0.5) * Math.PI)
  const cy = Math.cos((v - 0.5) * Math.PI)
  const dir = new THREE.Vector3(cy * Math.cos(theta), sy, cy * Math.sin(theta)).normalize()
  return {
    luma: best,
    uv: [u, v] as [number, number],
    dir,
    elevationDeg: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1))),
    azimuthDeg: THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z)),
    size: [w, h] as [number, number],
  }
}

/**
 * Average color of a thin band around the equirect's equator (v≈0.5 = the
 * visual horizon, elevation 0°) across all azimuths. Used to sync fog color
 * to whatever HDRI is active instead of a hand-picked hex guess — the fog
 * then always matches the actual sky background at ground level, for any
 * HDRI, without per-preset tuning.
 */
export function horizonBandColor(tex: THREE.Texture): THREE.Color | null {
  const img = tex.image as {
    data?: Float32Array | Uint16Array | Uint8Array
    width?: number
    height?: number
  }
  const w = img?.width ?? 0
  const h = img?.height ?? 0
  const data = img?.data
  if (!w || !h || !data) return null

  const channels = Math.max(3, Math.round(data.length / (w * h)))
  const half = tex.type === THREE.HalfFloatType
  const isByte = data instanceof Uint8Array && tex.type === THREE.UnsignedByteType
  const sample = (i: number) => {
    const v = data[i] ?? 0
    if (half) return THREE.DataUtils.fromHalfFloat(v)
    return v
  }

  const yLo = Math.floor(h * 0.48)
  const yHi = Math.ceil(h * 0.52)
  const step = Math.max(1, Math.floor(w / 512))
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let y = yLo; y <= yHi; y++) {
    for (let x = 0; x < w; x += step) {
      const o = (y * w + x) * channels
      let rr = sample(o)
      let gg = sample(o + 1)
      let bb = sample(o + 2)
      if (isByte) {
        const e = data[o + 3] ?? 0
        if (e) {
          const f = 2 ** (e - 128 - 8)
          rr *= f
          gg *= f
          bb *= f
        }
      }
      r += rr
      g += gg
      b += bb
      n++
    }
  }
  if (!n) return null
  const c = new THREE.Color(r / n, g / n, b / n)
  // HDR values can exceed 1 near the sun; clamp for use as a display-space
  // fog/haze tint rather than a lighting value.
  c.r = THREE.MathUtils.clamp(c.r, 0, 1)
  c.g = THREE.MathUtils.clamp(c.g, 0, 1)
  c.b = THREE.MathUtils.clamp(c.b, 0, 1)
  return c
}

/** Y-rotation that maps `from` onto `to` in XZ (azimuth only). */
export function yawToAlign(from: THREE.Vector3, to: THREE.Vector3) {
  const a = Math.atan2(to.x, to.z)
  const b = Math.atan2(from.x, from.z)
  return a - b
}
