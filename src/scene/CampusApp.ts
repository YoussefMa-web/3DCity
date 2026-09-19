import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ACTIVITIES, BRANDS, activitiesOf, brandById, type Activity, type BrandId } from '../data/activities'
import { NOC_MONITOR_SITES, NOC_OVERVIEW } from '../data/nocRoom'
import { iconSvg } from '../ui/icons'
import { Atmosphere } from './Atmosphere'
import { GlassPerformance } from './GlassPerformance'
import { applyCampusAsphalt, applyCampusGrass, finishMesh, hideInteriors } from './look'
import { addWorldGround } from './WorldGround'
import { PostProcessing } from './PostProcessing'
import { RENDER, QUALITY } from './RenderSettings'
import { TrafficSystem } from './TrafficSystem'

interface Manifest {
  sections: Array<{ id: string; file: string; skipped?: boolean }>
}

function blenderToThree(x: number, y: number, z: number) {
  return new THREE.Vector3(x, z, -y)
}

/** Files known to exist under /models/web/ (avoids per-file HEAD round-trips). */
const WEB_COPY = new Set([
  'carport.glb',
  'datacenter-exterior.glb',
  'datacenter.glb',
  'noc.glb',
  'reseau.glb',
  'site.glb',
  'solar.glb',
  'telecom.glb',
])

function resolveModel(file: string) {
  const path = WEB_COPY.has(file) ? `/models/web/${file}` : `/models/${file}`
  console.info(`[campus] model ${file} → ${path}`)
  return path
}

/** solar-equip.glb also contains solar-field meshes already loaded from solar.glb. */
function keepNamed(root: THREE.Object3D, pattern: RegExp) {
  const keep: THREE.Object3D[] = []
  root.traverse((obj) => {
    if (obj !== root && pattern.test(obj.name)) keep.push(obj)
  })
  root.updateMatrixWorld(true)
  for (const obj of keep) root.attach(obj)
  const drop = root.children.filter((obj) => !pattern.test(obj.name))
  for (const obj of drop) root.remove(obj)
}

export class CampusApp {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly controls: OrbitControls
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly clock = new THREE.Timer()
  private readonly atmosphere: Atmosphere
  private readonly glassPerf = new GlassPerformance()
  private readonly postProcessing: PostProcessing
  private readonly traffic = new TrafficSystem()
  private readonly markers = new Map<string, HTMLButtonElement>()
  private activeBrand: BrandId | null = null
  private nocSiteIndex: number | null = null
  private step = 0
  private flying = false
  private orbiting = false
  private ready = false
  /** Force shadowMap.needsUpdate for N frames after boot / orbit (manual shadow updates). */
  private shadowBakeFrames = 0

  constructor(canvas: HTMLCanvasElement) {
    this.clock.connect(document)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDER.pixelRatioMax))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.AgXToneMapping
    this.renderer.toneMappingExposure = RENDER.exposure
    this.renderer.setClearColor(0xb8c8d4, 1)
    this.renderer.shadowMap.enabled = true
    // r185: PCFSoftShadowMap is deprecated and aliases to PCF — set PCF explicitly.
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    // Manual updates only — full shadow passes every orbit frame kill FPS.
    this.renderer.shadowMap.autoUpdate = false
    this.renderer.shadowMap.needsUpdate = true
    this.shadowBakeFrames = RENDER.shadow.settleBakeFrames
    this.atmosphere = new Atmosphere(this.scene, this.renderer)

    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.8, 4200)
    const start = blenderToThree(-210, 40, 95)
    const look = blenderToThree(-40, 210, 6)
    this.camera.position.copy(start)
    this.camera.lookAt(look)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.target.copy(look)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.maxPolarAngle = Math.PI * 0.495
    this.controls.minPolarAngle = 0.08
    this.controls.minDistance = 8
    this.controls.maxDistance = 780
    this.controls.zoomSpeed = 0.9
    this.controls.rotateSpeed = 0.85
    this.controls.panSpeed = 0.85
    this.controls.update()
    this.controls.addEventListener('start', () => {
      this.orbiting = true
    })
    this.controls.addEventListener('end', () => {
      this.orbiting = false
      // Settled still: refresh focused shadows + re-enable GTAO (setMoving in frame).
      this.atmosphere.updateFocusedShadows(
        this.controls.target,
        this.camera.position.distanceTo(this.controls.target),
        true,
      )
      this.queueShadowBake()
    })

    this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera)
    this.buildUi()
    window.addEventListener('resize', () => this.resize())
    canvas.addEventListener('pointerdown', (event) => this.onPointer(event))
    this.renderer.setAnimationLoop(() => this.frame())
    void this.boot()
  }

  private async boot() {
    /** Models own 0–90%; finishing/materials own 90–100% so the bar never sits silent. */
    const MODEL_SPAN = 0.9
    const set = (ratio: number, detail?: string) => this.setBootProgress(ratio, detail)

    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(draco)

    try {
      const res = await fetch('/models/manifest.json')
      if (!res.ok) throw new Error('manifest missing')
      const manifest = (await res.json()) as Manifest
      const sections = manifest.sections.filter((section) => !section.skipped)
      const anisotropy = Math.min(RENDER.anisotropyCap, this.renderer.capabilities.getMaxAnisotropy())
      const skyReady = this.atmosphere.whenSkyReady()

      // Start the heaviest sections first so the last file isn't a giant trailing stall.
      const weight = (file: string) => (WEB_COPY.has(file) ? 1 : 10) + (file.startsWith('site') ? 100 : 0) + (file.startsWith('telecom') ? 50 : 0) + (file.startsWith('datacenter') ? 40 : 0) + (file.startsWith('poste') ? 60 : 0)
      const queue = [...sections].sort((a, b) => weight(b.file) - weight(a.file))
      const total = Math.max(1, sections.length)
      let done = 0
      const inflight = new Map<string, number>()

      const paintModelProgress = () => {
        let partial = 0
        for (const p of inflight.values()) partial += p
        const ratio = ((done + partial) / total) * MODEL_SPAN
        const current = [...inflight.keys()].slice(-2).join(' · ') || 'models'
        set(ratio, `Loading ${current}…`)
      }

      const loadGltf = (url: string, id: string) =>
        new Promise<Awaited<ReturnType<GLTFLoader['loadAsync']>>>((resolve, reject) => {
          loader.load(
            url,
            resolve,
            (xhr) => {
              if (!xhr.lengthComputable || xhr.total <= 0) return
              inflight.set(id, Math.min(0.92, xhr.loaded / xhr.total))
              paintModelProgress()
            },
            reject,
          )
        })

      const workers = Array.from({ length: 3 }, async () => {
        while (queue.length) {
          const section = queue.shift()
          if (!section) break
          inflight.set(section.id, 0.02)
          paintModelProgress()
          const file = resolveModel(section.file)
          const gltf = await loadGltf(file, section.id)
          inflight.set(section.id, 0.95)
          paintModelProgress()
          gltf.scene.name = section.id
          if (section.id === 'solar-equip') keepNamed(gltf.scene, /NETIS_PL_/i)
          gltf.scene.traverse((obj) => {
            const mesh = obj as THREE.Mesh
            if (!mesh.isMesh) return
            finishMesh(mesh, anisotropy)
          })
          this.scene.add(gltf.scene)
          this.glassPerf.collect(gltf.scene)
          if (section.id === 'site') this.traffic.init(gltf.scene)
          inflight.delete(section.id)
          done += 1
          paintModelProgress()
        }
      })
      await Promise.all(workers)
      set(0.91, 'Preparing sky, HDRI & lighting…')
      await skyReady
      hideInteriors(this.scene)
      set(0.94, 'Applying grass & ground materials…')
      await applyCampusGrass(this.scene, anisotropy)
      set(0.97, 'Building asphalt & road markings…')
      await applyCampusAsphalt(this.scene, anisotropy)
      set(0.98, 'Blending campus into countryside…')
      const world = new THREE.Box3()
      let hasBounds = false
      for (const child of this.scene.children) {
        if ((child as THREE.Light).isLight || child.userData.decoy) continue
        if (child.type === 'Sky') continue
        if (!hasBounds) {
          world.setFromObject(child)
          hasBounds = true
        } else {
          world.expandByObject(child)
        }
      }
      // Prefer the authored site footprint for countryside radius — expanding by
      // every section (telecom masts, far solar) balloons the AABB so the whole
      // overview stays inside a flat "under-campus" depression and the rolling
      // disc never appears (HDRI ground shows instead = photo plate look).
      const siteRoot = this.scene.getObjectByName('site')
      const footprint = new THREE.Box3()
      if (siteRoot) {
        footprint.setFromObject(siteRoot)
      } else {
        footprint.copy(world)
      }
      // Ignore extreme vertical outliers when sizing the ground disc.
      const footSize = footprint.getSize(new THREE.Vector3())
      const footCenter = footprint.getCenter(new THREE.Vector3())
      const clamped = footprint.clone()
      const maxFoot = 520
      if (footSize.x > maxFoot || footSize.z > maxFoot) {
        const hx = Math.min(footSize.x, maxFoot) * 0.5
        const hz = Math.min(footSize.z, maxFoot) * 0.5
        clamped.min.set(footCenter.x - hx, footprint.min.y, footCenter.z - hz)
        clamped.max.set(footCenter.x + hx, footprint.max.y, footCenter.z + hz)
      }
      const center = clamped.getCenter(new THREE.Vector3())
      const radius = clamped.getSize(new THREE.Vector3()).length() * 0.35
      await addWorldGround(this.scene, clamped, anisotropy)
      this.atmosphere.setCampusFog(center, radius)
      this.atmosphere.updateFocusedShadows(this.controls.target, this.camera.position.distanceTo(this.controls.target), true)
      this.queueShadowBake()
      this.postProcessing.setMoving(false)
      this.ready = true
      ;(window as unknown as { __CAMPUS_READY__?: boolean }).__CAMPUS_READY__ = true
      const heroHint = QUALITY === 'hero' ? ' · hero quality' : ''
      set(1, `Campus ready${heroHint}`)
      console.info('[campus] ready', { quality: QUALITY, tip: 'Add ?quality=hero for sharper stills' })
    } catch (err) {
      console.error(err)
      const msg = document.querySelector('#boot-message')
      if (msg) msg.textContent = 'Export de la scène en cours — relancez dans un instant'
    }
  }

  private setBootProgress(ratio: number, detail?: string) {
    const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
    const bar = document.querySelector('#boot-bar') as HTMLElement | null
    const label = document.querySelector('#boot-label')
    if (bar) bar.style.width = `${pct}%`
    if (label) label.textContent = `LOADING CAMPUS — ${pct}%`

    const messages = [
      'Assembling the interactive campus…',
      'Connecting telecom & power networks…',
      'Lighting mission-critical facilities…',
      'Integrating solar & outdoor grounds…',
      'Tuning sky, fog & reflections…',
      'Settling shadows for a premium view…',
    ]
    const msgIdx = Math.min(messages.length - 1, Math.floor(ratio * messages.length))
    const bootMsgEl = document.querySelector('#boot-message')
    if (bootMsgEl) bootMsgEl.textContent = detail ?? messages[msgIdx]

    if (pct >= 100) {
      const enterBtn = document.querySelector('#boot-enter-btn') as HTMLButtonElement | null
      if (enterBtn) {
        enterBtn.hidden = false
        enterBtn.onclick = () => this.hideBoot()
      }
    }
  }

  private hideBoot() {
    const boot = document.querySelector('#boot') as HTMLElement | null
    if (!boot) return
    boot.classList.add('is-done')
    window.setTimeout(() => boot.remove(), 900)
  }

  private buildUi() {
    const brands = document.querySelector('#brand-bar')
    if (!brands) return
    for (const brand of BRANDS) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'brand-btn'
      btn.dataset.brand = brand.id
      btn.style.setProperty('--brand', brand.color)
      btn.innerHTML = `<span class="brand-mark">${iconSvg(brand.id === 'solar' ? 'sun' : brand.id === 'telecom' ? 'tower' : 'datacenter')}</span><span><strong>${brand.name}</strong><small>${brand.tagline}</small></span>`
      btn.addEventListener('click', () => this.openBrand(brand.id))
      brands.append(btn)
    }

    const layer = document.querySelector('#icons')
    if (!layer) return
    for (const activity of ACTIVITIES) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'act-icon'
      btn.dataset.id = activity.id
      btn.hidden = true
      btn.style.setProperty('--brand', brandById(activity.brand).color)
      btn.innerHTML = `${iconSvg(activity.icon)}<span>${activity.title}</span>`
      btn.addEventListener('click', (event) => {
        event.stopPropagation()
        this.focus(activity)
      })
      layer.append(btn)
      this.markers.set(activity.id, btn)
    }

    document.querySelector('#panel-close')?.addEventListener('click', () => this.closePanel())
    document.querySelector('#step-prev')?.addEventListener('click', () => this.shift(-1))
    document.querySelector('#step-next')?.addEventListener('click', () => this.shift(1))
    document.querySelector('#back-overview')?.addEventListener('click', () => this.overview())
  }

  private openBrand(id: BrandId) {
    this.activeBrand = id
    this.step = 0
    document.querySelectorAll<HTMLButtonElement>('.brand-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.brand === id)
    })
    const path = document.querySelector('#parcours') as HTMLElement | null
    if (path) path.hidden = false
    this.renderSteps()
    const first = activitiesOf(id)[0]
    if (first) this.focus(first)
  }

  private renderSteps() {
    const host = document.querySelector('#step-icons')
    if (!host || !this.activeBrand) return
    host.innerHTML = ''
    const items = activitiesOf(this.activeBrand)
    items.forEach((activity, index) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'step-icon'
      btn.classList.toggle('is-current', index === this.step)
      btn.style.setProperty('--brand', brandById(activity.brand).color)
      btn.innerHTML = `${iconSvg(activity.icon)}<em>${activity.title}</em>`
      btn.addEventListener('click', () => this.focus(activity))
      host.append(btn)
    })
    const label = document.querySelector('#parcours-label')
    if (label) label.textContent = `${brandById(this.activeBrand).name} · ${this.step + 1} / ${items.length}`
  }

  private focus(activity: Activity) {
    if (this.activeBrand !== activity.brand) this.activeBrand = activity.brand
    const items = activitiesOf(activity.brand)
    this.step = Math.max(0, items.findIndex((item) => item.id === activity.id))
    this.renderSteps()
    this.openPanel(activity)
    this.fly(blenderToThree(...activity.cam), blenderToThree(...activity.target))
    this.syncMarkers()
  }

  private shift(dir: number) {
    if (!this.activeBrand) return
    const items = activitiesOf(this.activeBrand)
    const next = items[this.step + dir]
    if (next) this.focus(next)
  }

  private openPanel(activity: Activity) {
    const panel = document.querySelector('#panel') as HTMLElement | null
    if (!panel) return
    const brand = brandById(activity.brand)
    panel.hidden = false
    panel.style.setProperty('--brand', brand.color)
    const icon = document.querySelector('#panel-icon')
    if (icon) icon.innerHTML = iconSvg(activity.icon)
    const kicker = document.querySelector('#panel-kicker')
    if (kicker) kicker.textContent = `${brand.name} · ${activity.kicker}`
    const title = document.querySelector('#panel-title')
    if (title) title.textContent = activity.title
    const summary = document.querySelector('#panel-summary')
    if (summary) summary.textContent = activity.summary
    const list = document.querySelector('#panel-points')
    if (list) list.innerHTML = activity.points.map((point) => `<li>${point}</li>`).join('')
    const stats = document.querySelector('#panel-stats') as HTMLElement | null
    if (stats) {
      const rows = activity.stats ?? []
      stats.hidden = rows.length === 0
      stats.innerHTML = rows
        .map((stat) => `<div class="panel-stat"><strong>${stat.value}</strong><span>${stat.label}</span></div>`)
        .join('')
    }
    if (activity.nocRoom) this.renderNocPanel()
    else {
      this.nocSiteIndex = null
      const noc = document.querySelector('#panel-noc') as HTMLElement | null
      if (noc) {
        noc.hidden = true
        noc.innerHTML = ''
      }
    }
  }

  private renderNocPanel() {
    const host = document.querySelector('#panel-noc') as HTMLElement | null
    if (!host) return
    host.hidden = false
    const site = this.nocSiteIndex !== null ? NOC_MONITOR_SITES[this.nocSiteIndex] : null
    const chips = [
      `<button type="button" class="noc-chip ${site ? '' : 'is-active'}" data-noc="overview">Mur 13 écrans</button>`,
      ...NOC_MONITOR_SITES.map(
        (item, index) =>
          `<button type="button" class="noc-chip ${this.nocSiteIndex === index ? 'is-active' : ''}" data-noc="${index}">${item.title.split('·')[0].trim()}</button>`,
      ),
    ].join('')
    if (!site) {
      host.innerHTML = `
        <div class="noc-nav">${chips}</div>
        <p class="noc-sla">${NOC_OVERVIEW.kicker}</p>
        <p>${NOC_OVERVIEW.description}</p>
        <ul>${NOC_OVERVIEW.points.map((p) => `<li>${p}</li>`).join('')}</ul>
      `
    } else {
      host.innerHTML = `
        <div class="noc-nav">${chips}</div>
        <p class="noc-sla">${site.statusLabel} · SLA : ${site.sla}</p>
        <p class="noc-assets"><strong>Actifs :</strong> ${site.supervisedAssets}</p>
        <p>${site.description}</p>
        <div class="noc-kpi-grid">
          ${site.metrics
            .map(
              (m) =>
                `<div class="noc-kpi-card"><div class="noc-kpi-label">${m.label}</div><div class="noc-kpi-val">${m.value} <small>${m.unit ?? ''}</small></div></div>`,
            )
            .join('')}
        </div>
        <h4 class="noc-section-title">Inventaire</h4>
        ${site.equipment
          .map(
            (eq) =>
              `<div class="noc-equip-item"><span>${eq.name}</span><span>${eq.count} · ${eq.status}</span></div>`,
          )
          .join('')}
        <h4 class="noc-section-title">Procédures</h4>
        <ul>${site.procedures.map((p) => `<li>${p}</li>`).join('')}</ul>
      `
    }
    host.querySelectorAll<HTMLButtonElement>('.noc-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.noc
        this.nocSiteIndex = key === 'overview' || key === undefined ? null : Number(key)
        this.renderNocPanel()
      })
    })
  }

  private closePanel() {
    const panel = document.querySelector('#panel') as HTMLElement | null
    if (panel) panel.hidden = true
  }

  private overview() {
    this.activeBrand = null
    this.closePanel()
    const path = document.querySelector('#parcours') as HTMLElement | null
    if (path) path.hidden = true
    document.querySelectorAll('.brand-btn').forEach((btn) => btn.classList.remove('is-active'))
    this.fly(blenderToThree(-210, 40, 95), blenderToThree(-40, 210, 6))
    this.syncMarkers()
  }

  private fly(pos: THREE.Vector3, target: THREE.Vector3) {
    const from = this.camera.position.clone()
    const fromTarget = this.controls.target.clone()
    const start = performance.now()
    const duration = 1400
    this.flying = true
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      this.camera.position.lerpVectors(from, pos, e)
      this.controls.target.lerpVectors(fromTarget, target, e)
      this.controls.update()
      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        this.flying = false
        this.atmosphere.updateFocusedShadows(
          this.controls.target,
          this.camera.position.distanceTo(this.controls.target),
          true,
        )
        this.queueShadowBake()
      }
    }
    requestAnimationFrame(tick)
  }

  private syncMarkers() {
    const visible = this.activeBrand ? activitiesOf(this.activeBrand) : []
    const visibleIds = new Set(visible.map((item) => item.id))
    for (const activity of ACTIVITIES) {
      const marker = this.markers.get(activity.id)
      if (!marker) continue
      marker.hidden = !visibleIds.has(activity.id)
      marker.classList.toggle('is-current', visible[this.step]?.id === activity.id)
    }
  }

  private queueShadowBake(frames: number = RENDER.shadow.settleBakeFrames) {
    this.shadowBakeFrames = Math.max(this.shadowBakeFrames, frames)
    this.renderer.shadowMap.needsUpdate = true
  }

  private frame() {
    this.clock.update()
    const dt = this.clock.getDelta()
    if (!this.flying) this.controls.update()
    const dist = this.camera.position.distanceTo(this.controls.target)
    this.atmosphere.updateViewFog(dist, dt)
    // While orbiting/flying, skip shadow frustum retarget so the map is not rebuilt every frame.
    if (!this.orbiting && !this.flying && this.atmosphere.updateFocusedShadows(this.controls.target, dist)) {
      this.queueShadowBake(3)
    }
    if (this.shadowBakeFrames > 0) {
      this.renderer.shadowMap.needsUpdate = true
      this.shadowBakeFrames -= 1
    }
    // Settled views always refresh the shadow map — autoUpdate=false was leaving
    // empty/stale maps after boot (full-bright CAD, no building shadows).
    this.renderer.shadowMap.autoUpdate = !this.orbiting && !this.flying
    this.postProcessing.setMoving(this.flying || this.orbiting)
    this.glassPerf.update(this.flying || this.orbiting, dist, performance.now())
    if (this.ready) this.traffic.update(dt)
    this.projectMarkers()
    this.postProcessing.render()
  }

  private projectMarkers() {
    const width = window.innerWidth
    const height = window.innerHeight
    for (const activity of ACTIVITIES) {
      const marker = this.markers.get(activity.id)
      if (!marker || marker.hidden) continue
      const world = blenderToThree(...activity.anchor)
      const projected = world.clone().project(this.camera)
      if (projected.z > 1) {
        marker.style.opacity = '0'
        continue
      }
      marker.style.opacity = '1'
      marker.style.left = `${(projected.x * 0.5 + 0.5) * width}px`
      marker.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`
    }
  }

  private onPointer(event: PointerEvent) {
    if (!this.ready) return
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
  }

  private resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.postProcessing.setSize(window.innerWidth, window.innerHeight)
  }
}
