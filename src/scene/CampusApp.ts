import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ACTIVITIES, BRANDS, activitiesOf, brandById, type Activity, type BrandId } from '../data/activities'
import { NOC_MONITOR_SITES, NOC_OVERVIEW } from '../data/nocRoom'
import { iconSvg } from '../ui/icons'
import { sound } from '../ui/audio'
import { Atmosphere } from './Atmosphere'
import { GlassPerformance } from './GlassPerformance'
import { applyCampusAsphalt, applyCampusGrass, finishMesh, hideInteriors } from './look'
import { addWorldGround } from './WorldGround'
import { PostProcessing } from './PostProcessing'
import { RENDER, QUALITY } from './RenderSettings'
import { TrafficSystem } from './TrafficSystem'
import { TechnicianSystem, type TechnicianData } from './TechnicianSystem'
import { type HdriId } from './HdriCatalog'

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
  private readonly technicians = new TechnicianSystem()
  private readonly markers = new Map<string, HTMLButtonElement>()
  
  private activeBrand: BrandId | null = null
  private currentActivity: Activity | null = null
  private nocSiteIndex: number | null = null
  private step = 0
  private flying = false
  private orbiting = false
  private ready = false
  private zenMode = false
  private isTouring = false
  private tourTimer = 0
  private readonly TOUR_STEP_DURATION = 8000 // 8 seconds per POI during auto-tour
  
  private shadowBakeFrames = 0
  private searchFilter: 'all' | BrandId = 'all'
  private searchSelectedIndex = 0
  private filteredActivities: Activity[] = []

  private readonly campusTargetBounds = new THREE.Box3(
    new THREE.Vector3(-220, 0, -320),
    new THREE.Vector3(340, 35, -110),
  )

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
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.shadowMap.autoUpdate = false
    this.renderer.shadowMap.needsUpdate = true
    this.shadowBakeFrames = RENDER.shadow.settleBakeFrames
    this.atmosphere = new Atmosphere(this.scene, this.renderer)

    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.8, 4200)
    const start = blenderToThree(-180, 80, 68)
    const look = blenderToThree(-40, 210, 5)
    this.camera.position.copy(start)
    this.camera.lookAt(look)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.target.copy(look)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.maxPolarAngle = Math.PI * 0.44 // Ne sors pas sous le sol
    this.controls.minPolarAngle = 0.08
    this.controls.minDistance = 5 // Zoom proche
    this.controls.maxDistance = 240 // Bloqué sur le campus, impossible de s'éloigner dans le vide
    this.controls.zoomSpeed = 0.9
    this.controls.rotateSpeed = 0.85
    this.controls.panSpeed = 0.75
    this.controls.update()
    this.controls.addEventListener('start', () => {
      this.orbiting = true
    })
    this.controls.addEventListener('change', () => {
      this.controls.target.clamp(this.campusTargetBounds.min, this.campusTargetBounds.max)
      this.camera.position.y = Math.max(1.8, this.camera.position.y)
    })
    this.controls.addEventListener('end', () => {
      this.orbiting = false
      this.atmosphere.updateFocusedShadows(
        this.controls.target,
        this.camera.position.distanceTo(this.controls.target),
        true,
      )
      this.queueShadowBake()
    })

    this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera)
    this.buildUi()
    this.initKeyboardShortcuts()
    window.addEventListener('resize', () => this.resize())
    canvas.addEventListener('pointerdown', (event) => this.onPointer(event))
    this.renderer.setAnimationLoop(() => this.frame())
    void this.boot()
  }

  private async boot() {
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

      const weight = (file: string) => (WEB_COPY.has(file) ? 1 : 10) + (file.startsWith('site') ? 100 : 0) + (file.startsWith('telecom') ? 50 : 0) + (file.startsWith('datacenter') ? 40 : 0) + (file.startsWith('poste') ? 60 : 0)
      const queue = [...sections].sort((a, b) => weight(b.file) - weight(a.file))
      const total = Math.max(1, sections.length)
      let done = 0
      const inflight = new Map<string, number>()

      const paintModelProgress = () => {
        let partial = 0
        for (const p of inflight.values()) partial += p
        const ratio = ((done + partial) / total) * MODEL_SPAN
        const current = [...inflight.keys()].slice(-2).join(' · ') || 'modèles 3D'
        set(ratio, `Chargement de ${current}…`)
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
      set(0.91, 'Finalisation ciel HDRI & éclairage studio…')
      await skyReady
      hideInteriors(this.scene)
      set(0.94, 'Génération du gazon & textures paysagères…')
      await applyCampusGrass(this.scene, anisotropy)
      set(0.97, 'Construction voirie & marquages au sol…')
      await applyCampusAsphalt(this.scene, anisotropy)
      set(0.98, 'Intégration du campus dans la topographie…')
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
      const siteRoot = this.scene.getObjectByName('site')
      const footprint = new THREE.Box3()
      if (siteRoot) {
        footprint.setFromObject(siteRoot)
      } else {
        footprint.copy(world)
      }
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
      this.technicians.init(this.scene)
      this.queueShadowBake()
      this.postProcessing.setMoving(false)
      this.ready = true
      ;(window as unknown as { __CAMPUS_READY__?: boolean }).__CAMPUS_READY__ = true
      const heroHint = QUALITY === 'hero' ? ' · Qualité Maximale' : ''
      set(1, `Campus Prêt${heroHint}`)
      sound.playChime()
    } catch (err) {
      console.error(err)
      const msg = document.querySelector('#boot-message')
      if (msg) msg.textContent = 'Erreur lors du chargement des modèles 3D'
    }
  }

  private setBootProgress(ratio: number, detail?: string) {
    const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
    const bar = document.querySelector('#boot-bar') as HTMLElement | null
    const label = document.querySelector('#boot-label')
    if (bar) bar.style.width = `${pct}%`
    if (label) label.textContent = `CHARGEMENT DU CAMPUS — ${pct}%`

    const messages = [
      'Assemblage des infrastructures interactives…',
      'Connexion des réseaux télécom & énergie…',
      'Éclairage des installations critiques & BESS…',
      'Intégration centrale solaire & voirie…',
      'Calibration du ciel, brouillard & reflets…',
      'Optimisation des ombres et occlusion ambiante…',
    ]
    const msgIdx = Math.min(messages.length - 1, Math.floor(ratio * messages.length))
    const bootMsgEl = document.querySelector('#boot-message')
    if (bootMsgEl) bootMsgEl.textContent = detail ?? messages[msgIdx]

    if (pct >= 100) {
      const enterBtn = document.querySelector('#boot-enter-btn') as HTMLButtonElement | null
      if (enterBtn) {
        enterBtn.hidden = false
        enterBtn.onclick = () => {
          sound.playClick()
          this.hideBoot()
        }
      }
    }
  }

  private hideBoot() {
    const boot = document.querySelector('#boot') as HTMLElement | null
    if (!boot) return
    boot.classList.add('is-done')
    window.setTimeout(() => boot.remove(), 700)
  }

  private buildUi() {
    // Brand Navigation Tabs
    const brandsHost = document.querySelector('#brand-bar')
    if (brandsHost) {
      brandsHost.innerHTML = ''
      for (const brand of BRANDS) {
        const count = activitiesOf(brand.id).length
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'brand-btn'
        btn.dataset.brand = brand.id
        btn.style.setProperty('--brand', brand.color)
        btn.innerHTML = `
          <span class="brand-mark">${iconSvg(brand.id === 'solar' ? 'sun' : brand.id === 'telecom' ? 'tower' : 'datacenter')}</span>
          <span class="brand-info">
            <strong>${brand.name}</strong>
            <small>${brand.tagline}</small>
          </span>
          <span class="brand-badge-count">${count}</span>
        `
        btn.addEventListener('click', () => {
          sound.playClick()
          this.openBrand(brand.id)
        })
        brandsHost.append(btn)
      }
    }

    // 3D Markers Layer
    const layer = document.querySelector('#icons')
    if (layer) {
      layer.innerHTML = ''
      for (const activity of ACTIVITIES) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'act-icon'
        btn.dataset.id = activity.id
        btn.hidden = true
        btn.style.setProperty('--brand', brandById(activity.brand).color)
        btn.innerHTML = `
          <div class="act-icon-pin">${iconSvg(activity.icon)}</div>
          <span class="act-label">${activity.title}</span>
        `
        btn.addEventListener('click', (event) => {
          event.stopPropagation()
          sound.playClick()
          this.focus(activity)
        })
        layer.append(btn)
        this.markers.set(activity.id, btn)
      }
    }

    // Header buttons
    document.querySelector('#brand-overview-btn')?.addEventListener('click', () => {
      sound.playClick()
      this.overview()
    })
    document.querySelector('#back-overview')?.addEventListener('click', () => {
      sound.playClick()
      this.overview()
    })

    // Navigation Shift Arrows
    document.querySelector('#step-prev')?.addEventListener('click', () => {
      sound.playStep()
      this.shift(-1)
    })
    document.querySelector('#step-next')?.addEventListener('click', () => {
      sound.playStep()
      this.shift(1)
    })
    document.querySelector('#panel-btn-prev')?.addEventListener('click', () => {
      sound.playStep()
      this.shift(-1)
    })
    document.querySelector('#panel-btn-next')?.addEventListener('click', () => {
      sound.playStep()
      this.shift(1)
    })
    document.querySelector('#panel-btn-focus')?.addEventListener('click', () => {
      if (this.currentActivity) {
        sound.playWhoosh()
        this.focus(this.currentActivity)
      }
    })

    // Panel tabs
    document.querySelectorAll<HTMLButtonElement>('.panel-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        sound.playClick()
        const target = tab.dataset.tab
        document.querySelectorAll('.panel-tab').forEach((t) => t.classList.remove('is-active'))
        document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('is-active'))
        tab.classList.add('is-active')
        const pane = document.querySelector(`#panel-tab-${target}`)
        if (pane) pane.classList.add('is-active')
      })
    })

    document.querySelector('#panel-close')?.addEventListener('click', () => {
      sound.playClick()
      this.closePanel()
    })

    // Auto-Tour buttons
    document.querySelector('#btn-tour')?.addEventListener('click', () => {
      sound.playClick()
      this.toggleTour()
    })
    document.querySelector('#parcours-tour-toggle')?.addEventListener('click', () => {
      sound.playClick()
      this.toggleTour()
    })

    // Search dialog
    const searchBtn = document.querySelector('#btn-search')
    const searchDialog = document.querySelector<HTMLDialogElement>('#search-dialog')
    const searchInput = document.querySelector<HTMLInputElement>('#search-input')
    const searchClose = document.querySelector('#search-close-btn')

    searchBtn?.addEventListener('click', () => {
      sound.playClick()
      this.openSearch()
    })
    searchClose?.addEventListener('click', () => {
      searchDialog?.close()
    })
    searchDialog?.addEventListener('click', (e) => {
      if (e.target === searchDialog) searchDialog.close()
    })

    searchInput?.addEventListener('input', () => {
      this.renderSearchResults(searchInput.value)
    })
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        this.moveSearchSelection(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        this.moveSearchSelection(-1)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        this.selectSearchResult(this.searchSelectedIndex)
      }
    })

    // Search filter chips
    document.querySelectorAll<HTMLButtonElement>('.search-filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        sound.playClick()
        document.querySelectorAll('.search-filter-chip').forEach((c) => c.classList.remove('is-active'))
        chip.classList.add('is-active')
        this.searchFilter = (chip.dataset.filter as 'all' | BrandId) || 'all'
        if (searchInput) this.renderSearchResults(searchInput.value)
      })
    })

    // Camera Views dropdown
    const camMenuBtn = document.querySelector<HTMLButtonElement>('#btn-camera-menu')
    const camDropdown = document.querySelector<HTMLElement>('#dropdown-camera')
    camMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      sound.playClick()
      const isHidden = camDropdown?.hidden
      this.closeAllDropdowns()
      if (camDropdown) camDropdown.hidden = !isHidden
    })

    document.querySelectorAll<HTMLButtonElement>('#dropdown-camera .dropdown-item').forEach((item) => {
      item.addEventListener('click', () => {
        sound.playWhoosh()
        const cam = item.dataset.cam
        this.applyCameraPreset(cam)
        this.closeAllDropdowns()
      })
    })

    // Sky HDRI dropdown
    const skyMenuBtn = document.querySelector<HTMLButtonElement>('#btn-sky-menu')
    const skyDropdown = document.querySelector<HTMLElement>('#dropdown-sky')
    skyMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      sound.playClick()
      const isHidden = skyDropdown?.hidden
      this.closeAllDropdowns()
      if (skyDropdown) skyDropdown.hidden = !isHidden
    })

    document.querySelectorAll<HTMLButtonElement>('#dropdown-sky .dropdown-item').forEach((item) => {
      item.addEventListener('click', () => {
        sound.playClick()
        const hdri = item.dataset.hdri as HdriId
        if (hdri) {
          void this.atmosphere.setHdri(hdri)
          document.querySelectorAll('#dropdown-sky .dropdown-item').forEach((i) => i.classList.remove('is-active'))
          item.classList.add('is-active')
        }
        this.closeAllDropdowns()
      })
    })

    // Technicians dropdown
    const techsMenuBtn = document.querySelector<HTMLButtonElement>('#btn-techs-menu')
    const techsDropdown = document.querySelector<HTMLElement>('#dropdown-techs')
    techsMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      sound.playClick()
      const isHidden = techsDropdown?.hidden
      this.closeAllDropdowns()
      if (techsDropdown) techsDropdown.hidden = !isHidden
    })

    document.querySelectorAll<HTMLButtonElement>('#dropdown-techs .dropdown-item').forEach((item) => {
      item.addEventListener('click', () => {
        sound.playWhoosh()
        const techId = item.dataset.tech
        if (techId) {
          this.focusTechnician(techId)
        }
        this.closeAllDropdowns()
      })
    })

    // Close dropdowns on outside click
    window.addEventListener('click', () => this.closeAllDropdowns())

    // Audio Mute Toggle
    const audioBtn = document.querySelector<HTMLButtonElement>('#btn-audio')
    const iconSoundOn = document.querySelector('#icon-sound-on')
    const iconSoundOff = document.querySelector('#icon-sound-off')
    audioBtn?.addEventListener('click', () => {
      const isMuted = sound.toggleMute()
      if (iconSoundOn && iconSoundOff) {
        iconSoundOn.toggleAttribute('hidden', isMuted)
        iconSoundOff.toggleAttribute('hidden', !isMuted)
      }
    })

    // Zen Mode Toggle
    const zenBtn = document.querySelector('#btn-zen')
    const zenRestoreBtn = document.querySelector('#btn-zen-restore')
    zenBtn?.addEventListener('click', () => {
      sound.playClick()
      this.toggleZenMode(true)
    })
    zenRestoreBtn?.addEventListener('click', () => {
      sound.playClick()
      this.toggleZenMode(false)
    })

    // Help Dialog
    const helpBtn = document.querySelector('#btn-help')
    const helpDialog = document.querySelector<HTMLDialogElement>('#help-dialog')
    const helpClose = document.querySelector('#help-close-btn')
    helpBtn?.addEventListener('click', () => {
      sound.playClick()
      helpDialog?.showModal()
    })
    helpClose?.addEventListener('click', () => {
      helpDialog?.close()
    })
    helpDialog?.addEventListener('click', (e) => {
      if (e.target === helpDialog) helpDialog.close()
    })

    // Technician card close
    document.querySelector('#tech-card-close')?.addEventListener('click', () => {
      const card = document.querySelector<HTMLElement>('#tech-card')
      if (card) card.hidden = true
    })
  }

  private closeAllDropdowns() {
    document.querySelectorAll('.hud-dropdown').forEach((d) => {
      ;(d as HTMLElement).hidden = true
    })
  }

  private toggleZenMode(enable?: boolean) {
    this.zenMode = enable !== undefined ? enable : !this.zenMode
    const topbar = document.querySelector('#main-topbar')
    const parcours = document.querySelector('#parcours')
    const panel = document.querySelector('#panel')
    const icons = document.querySelector('#icons')
    const restoreBtn = document.querySelector('#btn-zen-restore')

    if (this.zenMode) {
      topbar?.classList.add('is-hidden')
      parcours?.classList.add('is-hidden')
      panel?.classList.add('is-hidden')
      if (icons) (icons as HTMLElement).style.opacity = '0'
      if (restoreBtn) (restoreBtn as HTMLElement).hidden = false
    } else {
      topbar?.classList.remove('is-hidden')
      parcours?.classList.remove('is-hidden')
      panel?.classList.remove('is-hidden')
      if (icons) (icons as HTMLElement).style.opacity = '1'
      if (restoreBtn) (restoreBtn as HTMLElement).hidden = true
    }
  }

  private applyCameraPreset(preset?: string) {
    switch (preset) {
      case 'overview':
        this.overview()
        break
      case 'iso':
        this.fly(blenderToThree(220, 20, 140), blenderToThree(-30, 200, 10))
        break
      case 'top':
        this.fly(blenderToThree(-50, 200, 320), blenderToThree(-50, 200, 0))
        break
      case 'solar':
        this.openBrand('solar')
        break
      case 'telecom':
        this.openBrand('telecom')
        break
      case 'data':
        this.openBrand('data')
        break
      case 'poste': {
        const act = ACTIVITIES.find((a) => a.id === 'solar-source')
        if (act) this.focus(act)
        break
      }
    }
  }

  private toggleTour() {
    this.isTouring = !this.isTouring
    this.tourTimer = 0
    const tourBtn = document.querySelector('#btn-tour')
    const tourLabel = document.querySelector('#tour-label')
    const tourIcon = document.querySelector('#tour-icon')
    const parcoursTourBtn = document.querySelector('#parcours-tour-toggle')
    const timerBar = document.querySelector('#tour-timer-bar')

    if (this.isTouring) {
      tourBtn?.classList.add('is-touring')
      if (tourLabel) tourLabel.textContent = 'Pause visite'
      if (tourIcon) tourIcon.innerHTML = iconSvg('pause')
      parcoursTourBtn?.classList.add('is-active')
      if (timerBar) (timerBar as HTMLElement).hidden = false
      if (!this.activeBrand) {
        this.openBrand('solar')
      }
    } else {
      tourBtn?.classList.remove('is-touring')
      if (tourLabel) tourLabel.textContent = 'Visite guidée'
      if (tourIcon) tourIcon.innerHTML = iconSvg('play')
      parcoursTourBtn?.classList.remove('is-active')
      if (timerBar) (timerBar as HTMLElement).hidden = true
    }
  }

  private openSearch() {
    const dialog = document.querySelector<HTMLDialogElement>('#search-dialog')
    const input = document.querySelector<HTMLInputElement>('#search-input')
    if (!dialog || !input) return
    dialog.showModal()
    input.value = ''
    this.searchSelectedIndex = 0
    this.renderSearchResults('')
    input.focus()
  }

  private renderSearchResults(query: string) {
    const host = document.querySelector('#search-results')
    if (!host) return
    const q = query.trim().toLowerCase()

    this.filteredActivities = ACTIVITIES.filter((item) => {
      if (this.searchFilter !== 'all' && item.brand !== this.searchFilter) return false
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        item.kicker.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.points.some((p) => p.toLowerCase().includes(q))
      )
    })

    if (this.searchSelectedIndex >= this.filteredActivities.length) {
      this.searchSelectedIndex = 0
    }

    if (this.filteredActivities.length === 0) {
      host.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--muted); font-size: 13px;">Aucune installation trouvée pour "${query}"</div>`
      return
    }

    host.innerHTML = this.filteredActivities
      .map((item, idx) => {
        const brand = brandById(item.brand)
        const isSelected = idx === this.searchSelectedIndex
        return `
          <div class="search-result-item ${isSelected ? 'is-selected' : ''}" data-idx="${idx}" style="--brand: ${brand.color}">
            <div class="search-result-icon">${iconSvg(item.icon)}</div>
            <div class="search-result-info">
              <strong>${item.title}</strong>
              <small>${brand.name} · ${item.kicker}</small>
            </div>
            <span class="search-result-badge">${brand.name.replace('NETIS ', '')}</span>
          </div>
        `
      })
      .join('')

    host.querySelectorAll<HTMLElement>('.search-result-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.idx)
        this.selectSearchResult(idx)
      })
    })
  }

  private moveSearchSelection(delta: number) {
    if (this.filteredActivities.length === 0) return
    this.searchSelectedIndex = (this.searchSelectedIndex + delta + this.filteredActivities.length) % this.filteredActivities.length
    const host = document.querySelector('#search-results')
    const items = host?.querySelectorAll('.search-result-item')
    items?.forEach((item, idx) => {
      item.classList.toggle('is-selected', idx === this.searchSelectedIndex)
      if (idx === this.searchSelectedIndex) {
        item.scrollIntoView({ block: 'nearest' })
      }
    })
  }

  private selectSearchResult(index: number) {
    const activity = this.filteredActivities[index]
    if (!activity) return
    const dialog = document.querySelector<HTMLDialogElement>('#search-dialog')
    dialog?.close()
    sound.playWhoosh()
    this.focus(activity)
  }

  private initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        this.openSearch()
        return
      }

      switch (e.key) {
        case '1':
          sound.playClick()
          this.openBrand('solar')
          break
        case '2':
          sound.playClick()
          this.openBrand('telecom')
          break
        case '3':
          sound.playClick()
          this.openBrand('data')
          break
        case '0':
          sound.playClick()
          this.overview()
          break
        case 'i':
        case 'I':
          sound.playWhoosh()
          this.applyCameraPreset('iso')
          break
        case 't':
        case 'T':
          sound.playWhoosh()
          this.applyCameraPreset('top')
          break
        case 'h':
        case 'H':
          this.toggleZenMode()
          break
        case 'm':
        case 'M':
          document.querySelector<HTMLButtonElement>('#btn-audio')?.click()
          break
        case ' ':
          e.preventDefault()
          this.toggleTour()
          break
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          sound.playStep()
          this.shift(1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          sound.playStep()
          this.shift(-1)
          break
        case '?': {
          const helpDialog = document.querySelector<HTMLDialogElement>('#help-dialog')
          helpDialog?.showModal()
          break
        }
        case 'Escape': {
          const searchDialog = document.querySelector<HTMLDialogElement>('#search-dialog')
          const helpDialog = document.querySelector<HTMLDialogElement>('#help-dialog')
          if (searchDialog?.open) {
            searchDialog.close()
          } else if (helpDialog?.open) {
            helpDialog.close()
          } else {
            this.overview()
          }
          break
        }
      }
    })
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
    const brand = brandById(this.activeBrand)

    items.forEach((activity, index) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'step-icon'
      btn.classList.toggle('is-current', index === this.step)
      btn.style.setProperty('--brand', brand.color)
      const numStr = String(index + 1).padStart(2, '0')
      btn.innerHTML = `
        <span class="step-icon-num">${numStr}</span>
        ${iconSvg(activity.icon)}
        <em>${activity.title}</em>
      `
      btn.addEventListener('click', () => {
        sound.playStep()
        this.focus(activity)
      })
      host.append(btn)
    })

    const sectorBadge = document.querySelector('#parcours-sector')
    if (sectorBadge) sectorBadge.textContent = brand.name.toUpperCase()
    const label = document.querySelector('#parcours-label')
    if (label) label.textContent = `${items[this.step]?.title ?? brand.name} (${this.step + 1} / ${items.length})`
  }

  private focus(activity: Activity) {
    if (this.activeBrand !== activity.brand) {
      this.activeBrand = activity.brand
      document.querySelectorAll<HTMLButtonElement>('.brand-btn').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.brand === activity.brand)
      })
      const path = document.querySelector('#parcours') as HTMLElement | null
      if (path) path.hidden = false
    }

    const items = activitiesOf(activity.brand)
    this.step = Math.max(0, items.findIndex((item) => item.id === activity.id))
    this.currentActivity = activity
    this.tourTimer = 0 // reset step timer

    this.renderSteps()
    this.openPanel(activity)
    this.fly(blenderToThree(...activity.cam), blenderToThree(...activity.target))
    this.syncMarkers()
  }

  private shift(dir: number) {
    if (!this.activeBrand) {
      this.openBrand('solar')
      return
    }
    const items = activitiesOf(this.activeBrand)
    let nextIndex = this.step + dir

    if (nextIndex >= items.length) {
      // Loop to next brand or start of current
      if (this.isTouring) {
        const brandOrder: BrandId[] = ['solar', 'telecom', 'data']
        const currentBrandIdx = brandOrder.indexOf(this.activeBrand)
        const nextBrand = brandOrder[(currentBrandIdx + 1) % brandOrder.length]
        this.openBrand(nextBrand!)
        return
      }
      nextIndex = 0
    } else if (nextIndex < 0) {
      nextIndex = items.length - 1
    }

    const next = items[nextIndex]
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
      stats.innerHTML = rows
        .map((stat) => `<div class="panel-stat"><strong>${stat.value}</strong><span>${stat.label}</span></div>`)
        .join('')
    }

    // NOC tab visibility
    const nocTabBtn = document.querySelector<HTMLButtonElement>('#tab-noc-btn')
    if (nocTabBtn) {
      nocTabBtn.hidden = !activity.nocRoom
    }

    if (activity.nocRoom) {
      this.renderNocPanel()
    } else {
      this.nocSiteIndex = null
      const noc = document.querySelector('#panel-noc') as HTMLElement | null
      if (noc) {
        noc.innerHTML = ''
      }
    }

    // Default to Overview tab
    document.querySelectorAll('.panel-tab').forEach((t) => t.classList.remove('is-active'))
    document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('is-active'))
    document.querySelector('.panel-tab[data-tab="overview"]')?.classList.add('is-active')
    document.querySelector('#panel-tab-overview')?.classList.add('is-active')
  }

  private renderNocPanel() {
    const host = document.querySelector('#panel-noc') as HTMLElement | null
    if (!host) return
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
        <div class="noc-sla-badge"><span class="pulse-dot"></span> ${NOC_OVERVIEW.kicker}</div>
        <p class="panel-summary" style="margin-top: 8px;">${NOC_OVERVIEW.description}</p>
        <ul class="panel-points-list">${NOC_OVERVIEW.points.map((p) => `<li>${p}</li>`).join('')}</ul>
      `
    } else {
      host.innerHTML = `
        <div class="noc-nav">${chips}</div>
        <div class="noc-sla-badge"><span class="pulse-dot"></span> ${site.statusLabel} · SLA ${site.sla}</div>
        <p class="panel-summary" style="margin-top: 6px;">${site.description}</p>
        <div class="noc-kpi-grid">
          ${site.metrics
            .map(
              (m) =>
                `<div class="noc-kpi-card"><div class="noc-kpi-label">${m.label}</div><div class="noc-kpi-val">${m.value} <small>${m.unit ?? ''}</small></div></div>`,
            )
            .join('')}
        </div>
        <div class="panel-section-title">Inventaire & Télémétrie</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${site.equipment
            .map(
              (eq) =>
                `<div class="noc-equip-item"><span>${eq.name} (${eq.count})</span><span class="noc-equip-tag">${eq.status}</span></div>`,
            )
            .join('')}
        </div>
        <div class="panel-section-title" style="margin-top: 8px;">Procédures d’Intervention</div>
        <ul class="panel-points-list">${site.procedures.map((p) => `<li>${p}</li>`).join('')}</ul>
      `
    }

    host.querySelectorAll<HTMLButtonElement>('.noc-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        sound.playClick()
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
    this.currentActivity = null
    this.closePanel()
    const path = document.querySelector('#parcours') as HTMLElement | null
    if (path) path.hidden = true
    document.querySelectorAll('.brand-btn').forEach((btn) => btn.classList.remove('is-active'))
    this.fly(blenderToThree(-180, 80, 68), blenderToThree(-40, 210, 5))
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
    if (!this.flying) {
      this.controls.target.clamp(this.campusTargetBounds.min, this.campusTargetBounds.max)
      this.camera.position.y = Math.max(1.8, this.camera.position.y)
      this.controls.update()
    }
    const dist = this.camera.position.distanceTo(this.controls.target)
    this.atmosphere.updateViewFog(dist, dt)

    if (!this.orbiting && !this.flying && this.atmosphere.updateFocusedShadows(this.controls.target, dist)) {
      this.queueShadowBake(3)
    }
    if (this.shadowBakeFrames > 0) {
      this.renderer.shadowMap.needsUpdate = true
      this.shadowBakeFrames -= 1
    }
    this.renderer.shadowMap.autoUpdate = !this.orbiting && !this.flying
    this.postProcessing.setMoving(this.flying || this.orbiting)
    this.glassPerf.update(this.flying || this.orbiting, dist, performance.now())
    if (this.ready) {
      this.traffic.update(dt)
      this.technicians.update(dt)
    }

    // Tour timer update
    if (this.isTouring && !this.flying) {
      this.tourTimer += dt * 1000
      const pct = Math.min(100, (this.tourTimer / this.TOUR_STEP_DURATION) * 100)
      const fillEl = document.querySelector('#tour-timer-fill') as HTMLElement | null
      if (fillEl) fillEl.style.width = `${pct}%`
      if (this.tourTimer >= this.TOUR_STEP_DURATION) {
        this.shift(1)
      }
    }

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

    // Raycast for technician inspection
    const techGroup = this.scene.getObjectByName('campus-technicians')
    if (techGroup) {
      const hits = this.raycaster.intersectObjects(techGroup.children, true)
      if (hits.length > 0) {
        let rootObj: THREE.Object3D | null = hits[0]!.object
        while (rootObj && !rootObj.userData.technician && rootObj.parent) {
          rootObj = rootObj.parent
        }
        if (rootObj && rootObj.userData.technician) {
          sound.playClick()
          this.showTechnicianCard(rootObj.userData.technician)
        }
      }
    }
  }

  private showTechnicianCard(tech: TechnicianData) {
    const card = document.querySelector<HTMLElement>('#tech-card')
    const name = document.querySelector('#tech-card-name')
    const role = document.querySelector('#tech-card-role')
    const zone = document.querySelector('#tech-card-zone')
    const task = document.querySelector('#tech-card-task')
    if (!card) return
    card.hidden = false
    if (name) name.textContent = tech.name
    if (role) role.textContent = tech.role
    if (zone) zone.textContent = tech.zone
    if (task) task.textContent = tech.task
  }

  private focusTechnician(id: string) {
    const tech = this.technicians.getTechnicianById(id)
    if (!tech) return
    const targetPos = blenderToThree(...tech.position)
    const camPos = tech.camPos
      ? blenderToThree(...tech.camPos)
      : targetPos.clone().add(new THREE.Vector3(5, 3.5, 5))

    this.showTechnicianCard(tech)
    this.fly(camPos, targetPos)
  }

  private resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.postProcessing.setSize(window.innerWidth, window.innerHeight)
  }
}
