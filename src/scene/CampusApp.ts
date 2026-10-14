import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ACTIVITIES, BRANDS, activitiesOf, brandById, placeById, type Activity, type ActivityPlace, type BrandId } from '../data/activities'
import { DC_INTERIOR_STEPS, type InteriorStepDef } from '../data/interior'
import { NOC_MONITOR_SITES, NOC_OVERVIEW } from '../data/nocRoom'
import { iconSvg } from '../ui/icons'
import { sound } from '../ui/audio'
import { Atmosphere } from './Atmosphere'
import { CameraDirector, type CameraShot } from './CameraDirector'
import { Cutaway } from './Cutaway'
import { FacadeLod } from './FacadeLod'
import { GlassPerformance } from './GlassPerformance'
import { applyCampusAsphalt, applyCampusGrass, finishMesh, fitGeneratorCanopies, hideInteriors, isInteriorName, seatStreetLamps, setInteriorVisibility } from './look'
import { NetworkFlows } from './NetworkFlows'
import { NocInterior } from './NocInterior'
import { addWorldGround } from './WorldGround'
import { addSourcePowerLines } from './PowerLines'
import { PostProcessing } from './PostProcessing'
import { RENDER, QUALITY } from './RenderSettings'
import { TrafficSystem } from './TrafficSystem'
import { TechnicianSystem, TECHNICIANS, type TechnicianData } from './TechnicianSystem'
import { type HdriId } from './HdriCatalog'

interface Manifest {
  sections: Array<{ id: string; file: string; skipped?: boolean }>
}

function blenderToThree(x: number, y: number, z: number) {
  return new THREE.Vector3(x, z, -y)
}

function threeToBlender(v: THREE.Vector3): [number, number, number] {
  const round = (n: number) => Math.round(n * 10) / 10
  return [round(v.x), round(-v.z), round(v.y)]
}

const CAMERA_SHOTS_KEY = 'campus.cameraShots'

interface SavedCameraShot {
  cam: [number, number, number]
  target: [number, number, number]
  fov: number
}

function loadCameraShots(): Map<string, SavedCameraShot> {
  try {
    const raw = localStorage.getItem(CAMERA_SHOTS_KEY)
    if (!raw) return new Map()
    const parsed = JSON.parse(raw) as Record<string, SavedCameraShot>
    return new Map(Object.entries(parsed))
  } catch {
    return new Map()
  }
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
  private readonly facadeLod = new FacadeLod()
  private readonly postProcessing: PostProcessing
  private readonly director: CameraDirector
  private readonly cutaway: Cutaway
  private readonly flows = new NetworkFlows()
  private readonly traffic = new TrafficSystem()
  private readonly technicians = new TechnicianSystem()
  private readonly markers = new Map<string, HTMLButtonElement>()
  
  private activeBrand: BrandId | null = null
  private currentActivity: Activity | null = null
  private currentPlaceId: string | null = null
  private nocSiteIndex: number | null = null
  private step = 0
  private flying = false
  private ready = false
  private zenMode = false
  private isTouring = false
  private tourTimer = 0
  private readonly TOUR_STEP_DURATION = 8000 // 8 seconds per POI during auto-tour
  private elapsed = 0
  private interiorMode = false
  private interiorKind: 'dc' | 'noc' | null = null
  private interiorIndex = 0
  private interiorSteps: Array<InteriorStepDef & { objects: THREE.Object3D[] }> = []
  private interiorHidden: THREE.Object3D[] = []
  private interiorRoomShot: CameraShot | null = null
  private interiorOrbit: { minPolar: number; maxPolar: number; minDistance: number; maxDistance: number } | null = null
  private nocRoom3d: NocInterior | null = null
  private nocHidden: THREE.Object3D[] = []
  
  private shadowBakeFrames = 0
  private readonly cameraShots = loadCameraShots()
  private bootDismissed = false
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
      // The composer target carries MSAA. The canvas flag does not apply to it.
      antialias: false,
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
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.autoUpdate = true
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
    this.controls.dampingFactor = 0.14
    this.controls.maxPolarAngle = Math.PI * 0.44 // Laisse passer les plans d'activité. Les collines coupent l'horizon.
    this.controls.minPolarAngle = 0.08
    this.controls.minDistance = 5 // Zoom proche
    this.controls.maxDistance = 172 // Le plan large reste sur le campus, pas dans la nappe verte
    this.controls.zoomSpeed = 1.15
    this.controls.rotateSpeed = 1.05
    this.controls.panSpeed = 0.95
    this.controls.update()
    this.director = new CameraDirector(this.camera, this.controls)
    this.cutaway = new Cutaway(this.renderer)
    this.scene.add(this.flows.group)
    this.controls.addEventListener('change', () => {
      this.controls.target.clamp(this.campusTargetBounds.min, this.campusTargetBounds.max)
      this.camera.position.y = Math.max(1.8, this.camera.position.y)
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
        const current = [...inflight.keys()].slice(-2).join(' · ') || '3D models'
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
      seatStreetLamps(this.scene)
      fitGeneratorCanopies(this.scene)
      set(0.91, 'Finishing the HDRI sky and studio lighting…')
      await skyReady
      hideInteriors(this.scene)
      set(0.93, 'Stabilising distant façades…')
      this.facadeLod.prepare(this.scene, this.camera, this.renderer)
      set(0.94, 'Generating turf and landscape textures…')
      await applyCampusGrass(this.scene, anisotropy)
      set(0.97, 'Building roads and ground markings…')
      await applyCampusAsphalt(this.scene, anisotropy)
      set(0.98, 'Settling the campus into the terrain…')
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
      this.atmosphere.updateFocusedShadows(
        this.controls.target,
        this.camera.position.distanceTo(this.controls.target),
        0,
        true,
      )
      await this.technicians.init(this.scene)
      addSourcePowerLines(this.scene)
      await this.flows.load()
      if (!world.isEmpty()) this.flows.pruneOutside(world)
      this.queueShadowBake()
      this.ready = true
      ;(window as unknown as { __CAMPUS_READY__?: boolean }).__CAMPUS_READY__ = true
      const heroHint = QUALITY === 'hero' ? ' · Maximum quality' : ''
      set(1, `Campus ready${heroHint}`)
      sound.playChime()
    } catch (err) {
      console.error(err)
      const msg = document.querySelector('#boot-message')
      if (msg) msg.textContent = 'Error while loading the 3D models'
    }
  }

  private setBootProgress(ratio: number, detail?: string) {
    const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
    const bar = document.querySelector('#boot-bar') as HTMLElement | null
    const label = document.querySelector('#boot-label')
    if (bar) bar.style.width = `${pct}%`
    if (label) label.textContent = `LOADING THE CAMPUS — ${pct}%`

    const messages = [
      'Assembling the interactive infrastructure…',
      'Connecting telecom and power networks…',
      'Lighting critical plant and the BESS…',
      'Placing the solar plant and roads…',
      'Calibrating sky, haze and reflections…',
      'Tuning shadows and ambient occlusion…',
    ]
    const msgIdx = Math.min(messages.length - 1, Math.floor(ratio * messages.length))
    const bootMsgEl = document.querySelector('#boot-message')
    if (bootMsgEl) bootMsgEl.textContent = detail ?? messages[msgIdx]

    if (pct >= 100 && !this.bootDismissed) {
      this.bootDismissed = true
      this.hideBoot()
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
          <span class="brand-mark">${iconSvg(brand.icon)}</span>
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
    document.querySelector('#panel-btn-camera')?.addEventListener('click', () => {
      sound.playClick()
      this.openCameraAdjust()
    })
    document.querySelector('#camera-adjust-save')?.addEventListener('click', () => {
      sound.playClick()
      this.saveCameraShot()
    })
    document.querySelector('#camera-adjust-reset')?.addEventListener('click', () => {
      sound.playClick()
      this.resetCameraShot()
    })
    document.querySelector('#camera-adjust-close')?.addEventListener('click', () => {
      sound.playClick()
      this.closeCameraAdjust()
    })
    document.querySelector('#panel-enter-interior')?.addEventListener('click', () => {
      sound.playWhoosh()
      this.enterInterior()
    })
    document.querySelector('#interior-prev')?.addEventListener('click', () => {
      sound.playStep()
      this.showInteriorStep(this.interiorIndex - 1)
    })
    document.querySelector('#interior-next')?.addEventListener('click', () => {
      sound.playStep()
      this.showInteriorStep(this.interiorIndex + 1)
    })
    document.querySelector('#interior-exit')?.addEventListener('click', () => {
      sound.playClick()
      this.exitInterior()
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

    if (techsDropdown) {
      techsDropdown.style.width = '420px'
      techsDropdown.querySelectorAll('.dropdown-item').forEach((item) => item.remove())
      const header = techsDropdown.querySelector('.dropdown-header')
      if (header) header.textContent = 'Role and task'
      const countLabel = techsMenuBtn?.querySelector('.hud-btn-text')
      if (countLabel) countLabel.textContent = `Technicians (${TECHNICIANS.length})`
      for (const tech of TECHNICIANS) {
        const item = document.createElement('button')
        item.type = 'button'
        item.className = 'dropdown-item tech-menu-item'
        item.dataset.tech = tech.id
        item.innerHTML = `<span>${tech.role}</span><small>${tech.task}</small>`
        techsDropdown.append(item)
      }
    }

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
    const interior = document.querySelector('#interior-bar')

    if (this.zenMode) {
      topbar?.classList.add('is-hidden')
      parcours?.classList.add('is-hidden')
      panel?.classList.add('is-hidden')
      interior?.classList.add('is-hidden')
      if (icons) (icons as HTMLElement).style.opacity = '0'
      if (restoreBtn) (restoreBtn as HTMLElement).hidden = false
    } else {
      topbar?.classList.remove('is-hidden')
      parcours?.classList.remove('is-hidden')
      panel?.classList.remove('is-hidden')
      interior?.classList.remove('is-hidden')
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
      case 'energies':
        this.openBrand('energies')
        break
      case 'telecom':
        this.openBrand('telecom')
        break
      case 'managed':
        this.openBrand('managed')
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
      if (tourLabel) tourLabel.textContent = 'Pause tour'
      if (tourIcon) tourIcon.innerHTML = iconSvg('pause')
      parcoursTourBtn?.classList.add('is-active')
      if (timerBar) (timerBar as HTMLElement).hidden = false
      if (!this.activeBrand) {
        this.openBrand('telecom')
      }
    } else {
      tourBtn?.classList.remove('is-touring')
      if (tourLabel) tourLabel.textContent = 'Guided tour'
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
        item.points.some((p) => p.toLowerCase().includes(q)) ||
        (item.places ?? []).some(
          (place) =>
            place.title.toLowerCase().includes(q) ||
            place.summary.toLowerCase().includes(q) ||
            place.points.some((point) => point.toLowerCase().includes(q)),
        )
      )
    })

    if (this.searchSelectedIndex >= this.filteredActivities.length) {
      this.searchSelectedIndex = 0
    }

    if (this.filteredActivities.length === 0) {
      host.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--muted); font-size: 13px;">No installation found for "${query}"</div>`
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
    const query = document.querySelector<HTMLInputElement>('#search-input')?.value.trim().toLowerCase() ?? ''
    const place = query
      ? activity.places?.find(
          (item) => item.title.toLowerCase().includes(query) || item.summary.toLowerCase().includes(query),
        )
      : undefined
    this.focus(activity, place?.id ?? null)
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
          this.openBrand('telecom')
          break
        case '2':
          sound.playClick()
          this.openBrand('energies')
          break
        case '3':
          sound.playClick()
          this.openBrand('managed')
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
          if (this.interiorMode) this.showInteriorStep(this.interiorIndex + 1)
          else this.shift(1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          sound.playStep()
          if (this.interiorMode) this.showInteriorStep(this.interiorIndex - 1)
          else this.shift(-1)
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

  private opensInterior(activity: Activity, placeId: string | null) {
    if (activity.nocRoom) return placeId == null || placeId === 'wall' || placeId === 'dispatch'
    if (activity.id === 'data-shell') return placeId == null || placeId === 'hall'
    return false
  }

  private focus(activity: Activity, placeId: string | null = null) {
    const direct = this.opensInterior(activity, placeId)
    if (this.interiorMode && !direct) this.exitInterior(false)
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
    this.currentPlaceId = placeId
    this.tourTimer = 0

    this.renderSteps()
    this.openPanel(activity)
    const place = placeById(activity, placeId)
    if (direct) this.enterInterior({ keepTour: this.isTouring })
    else this.flyShot(this.shotFor(activity, place))
    this.flows.setActiveFlow(place?.flowKind ?? activity.flowKind ?? null)
    this.syncMarkers()
    this.syncCameraAdjust()
  }

  private shift(dir: number) {
    if (!this.activeBrand) {
      this.openBrand('telecom')
      return
    }
    const items = activitiesOf(this.activeBrand)
    let nextIndex = this.step + dir

    if (nextIndex >= items.length) {
      // Loop to next brand or start of current
      if (this.isTouring) {
        const brandOrder: BrandId[] = ['telecom', 'energies', 'managed']
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
    if (title) title.textContent = placeById(activity, this.currentPlaceId)?.title ?? activity.title
    const summary = document.querySelector('#panel-summary')
    const place = placeById(activity, this.currentPlaceId)
    if (summary) summary.textContent = place?.summary ?? activity.summary
    const list = document.querySelector('#panel-points')
    const points = place?.points ?? activity.points
    if (list) list.innerHTML = points.map((point) => `<li>${point}</li>`).join('')
    this.renderPlaces(activity)
    this.renderBenefits(place?.benefits ?? activity.benefits)
    this.renderFlowLegend(place?.flowKind ?? activity.flowKind)

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

    const enter = document.querySelector<HTMLButtonElement>('#panel-enter-interior')
    if (enter) enter.hidden = !activity.enterInterior

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
      `<button type="button" class="noc-chip ${site ? '' : 'is-active'}" data-noc="overview">13-screen wall</button>`,
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
        <div class="panel-section-title">Inventory and telemetry</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${site.equipment
            .map(
              (eq) =>
                `<div class="noc-equip-item"><span>${eq.name} (${eq.count})</span><span class="noc-equip-tag">${eq.status}</span></div>`,
            )
            .join('')}
        </div>
        <div class="panel-section-title" style="margin-top: 8px;">Response procedures</div>
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
    this.closeCameraAdjust()
  }

  private overview() {
    if (this.interiorMode) this.exitInterior(false)
    this.activeBrand = null
    this.currentActivity = null
    this.currentPlaceId = null
    this.flows.setActiveFlow(null)
    this.closePanel()
    const path = document.querySelector('#parcours') as HTMLElement | null
    if (path) path.hidden = true
    document.querySelectorAll('.brand-btn').forEach((btn) => btn.classList.remove('is-active'))
    this.fly(blenderToThree(-180, 80, 68), blenderToThree(-40, 210, 5))
    this.syncMarkers()
  }

  private fly(pos: THREE.Vector3, target: THREE.Vector3, fov = 46, minDistance = 5, maxDistance = 172) {
    this.flyShot({ position: pos, target, fov, minDistance, maxDistance })
  }

  private flyShot(shot: CameraShot) {
    this.controls.enabled = false
    this.flying = true
    this.controls.maxDistance = shot.maxDistance ?? 172
    this.director.flyTo(shot, 0.52, () => {
      this.flying = false
      this.controls.enabled = true
    })
  }

  private shotKey(activity: Activity, place?: ActivityPlace | null) {
    return place ? `${activity.id}:${place.id}` : activity.id
  }

  private shotFor(activity: Activity, place?: ActivityPlace): CameraShot {
    const saved = this.cameraShots.get(this.shotKey(activity, place))
    const cam = saved?.cam ?? place?.cam ?? activity.cam
    const target = saved?.target ?? place?.target ?? activity.target
    const position = blenderToThree(...cam)
    const look = blenderToThree(...target)
    const distance = position.distanceTo(look)
    const authoredMax = Math.min(place?.maxDistance ?? activity.maxDistance ?? 172, 172)
    return {
      position,
      target: look,
      fov: saved?.fov ?? place?.fov ?? activity.fov ?? 42,
      minDistance: Math.min(place?.minDistance ?? activity.minDistance ?? 5, Math.max(2, distance * 0.35)),
      maxDistance: Math.max(authoredMax, distance + 12),
    }
  }

  private openCameraAdjust() {
    if (!this.currentActivity) return
    if (this.isTouring) this.toggleTour()
    this.director.cancel()
    this.flying = false
    this.controls.enabled = true
    this.controls.minDistance = 2
    this.controls.maxDistance = 220
    const bar = document.querySelector<HTMLElement>('#camera-adjust')
    if (bar) bar.hidden = false
    this.syncCameraAdjust()
  }

  private closeCameraAdjust() {
    const bar = document.querySelector<HTMLElement>('#camera-adjust')
    if (bar) bar.hidden = true
  }

  private saveCameraShot() {
    const activity = this.currentActivity
    if (!activity) return
    const place = placeById(activity, this.currentPlaceId)
    const shot: SavedCameraShot = {
      cam: threeToBlender(this.camera.position),
      target: threeToBlender(this.controls.target),
      fov: Math.round(this.camera.fov),
    }
    this.cameraShots.set(this.shotKey(activity, place), shot)
    this.persistCameraShots()
    this.syncCameraAdjust('Vue enregistrée. Elle sera reprise à la prochaine ouverture de ce point.')
  }

  private resetCameraShot() {
    const activity = this.currentActivity
    if (!activity) return
    const place = placeById(activity, this.currentPlaceId)
    this.cameraShots.delete(this.shotKey(activity, place))
    this.persistCameraShots()
    this.flyShot(this.shotFor(activity, place))
    this.syncCameraAdjust('Vue d’origine rétablie.')
  }

  private persistCameraShots() {
    const data: Record<string, SavedCameraShot> = {}
    for (const [key, shot] of this.cameraShots) data[key] = shot
    localStorage.setItem(CAMERA_SHOTS_KEY, JSON.stringify(data))
  }

  private syncCameraAdjust(note?: string) {
    const activity = this.currentActivity
    const button = document.querySelector<HTMLButtonElement>('#panel-btn-camera')
    const place = activity ? placeById(activity, this.currentPlaceId) : undefined
    const saved = activity ? this.cameraShots.has(this.shotKey(activity, place)) : false
    button?.classList.toggle('is-saved', saved)
    const label = document.querySelector('#camera-adjust-label')
    const bar = document.querySelector<HTMLElement>('#camera-adjust')
    if (!label || bar?.hidden) return
    const name = place?.title ?? activity?.title ?? 'ce point'
    label.textContent = note ?? `Vue de « ${name} ». Tourne avec la souris, puis enregistre.`
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
    // A stalled frame must not teleport the camera, fog, or traffic.
    const dt = Math.min(this.clock.getDelta(), 1 / 30)
    this.elapsed += dt
    this.director.update(dt)
    this.flying = this.director.busy
    if (!this.flying) {
      this.controls.target.clamp(this.campusTargetBounds.min, this.campusTargetBounds.max)
      this.camera.position.y = Math.max(1.8, this.camera.position.y)
      this.controls.update()
    }
    const dist = this.camera.position.distanceTo(this.controls.target)
    this.atmosphere.updateViewFog(dist, dt)
    this.atmosphere.updateFocusedShadows(this.controls.target, dist, dt)
    if (this.shadowBakeFrames > 0) {
      this.renderer.shadowMap.needsUpdate = true
      this.shadowBakeFrames -= 1
    }
    this.glassPerf.update(this.flying, dist, performance.now())
    this.facadeLod.update(this.camera, this.renderer, dt)
    this.nocRoom3d?.update(this.elapsed)
    if (this.ready) {
      this.traffic.update(dt)
      this.technicians.update(dt)
      this.flows.update(dt, this.elapsed)
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
    const role = document.querySelector<HTMLElement>('#tech-card-role')
    const zone = document.querySelector<HTMLElement>('#tech-card-zone')
    const task = document.querySelector('#tech-card-task')
    if (!card) return
    card.hidden = false
    if (name) name.textContent = tech.role
    if (role) role.hidden = true
    if (zone) zone.hidden = true
    if (task) task.textContent = tech.task
  }

  private focusTechnician(id: string) {
    const tech = this.technicians.getTechnicianById(id)
    if (!tech) return
    const authored = blenderToThree(...tech.position)
    const placed = this.technicians.getPlacement(id) ?? authored
    const camPos = tech.camPos
      ? blenderToThree(...tech.camPos).add(placed.clone().sub(authored))
      : placed.clone().add(new THREE.Vector3(5, 3.5, 5))

    this.showTechnicianCard(tech)
    this.fly(camPos, placed)
  }

  private resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.postProcessing.setSize(window.innerWidth, window.innerHeight)
  }

  private renderPlaces(activity: Activity) {
    const host = document.querySelector<HTMLElement>('#panel-places')
    if (!host) return
    const places = activity.places ?? []
    host.hidden = places.length === 0
    host.innerHTML = places
      .map(
        (place) =>
          `<button type="button" class="place-chip ${place.id === this.currentPlaceId ? 'is-active' : ''}" data-place="${place.id}">${place.title}</button>`,
      )
      .join('')
    host.querySelectorAll<HTMLButtonElement>('.place-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        sound.playStep()
        const next = chip.dataset.place === this.currentPlaceId ? null : chip.dataset.place ?? null
        this.focus(activity, next)
      })
    })
  }

  private renderBenefits(benefits?: string[]) {
    const host = document.querySelector<HTMLElement>('#panel-benefits')
    if (!host) return
    if (!benefits?.length) {
      host.hidden = true
      host.innerHTML = ''
      return
    }
    host.hidden = false
    host.innerHTML = `<div class="panel-section-title">What this changes</div><ul class="panel-points-list">${benefits
      .map((item) => `<li>${item}</li>`)
      .join('')}</ul>`
  }

  private renderFlowLegend(kind?: 'fiber' | 'power') {
    const host = document.querySelector<HTMLElement>('#panel-flow')
    if (!host) return
    if (!kind) {
      host.hidden = true
      return
    }
    host.hidden = false
    host.dataset.kind = kind
    host.innerHTML =
      kind === 'fiber'
        ? '<span class="flow-key"><i class="is-aerial"></i><span>Aerial fibre — pole to façade</span></span><span class="flow-key"><i class="is-buried"></i><span>Underground fibre — buried duct</span></span>'
        : '<span class="flow-key"><i class="is-aerial"></i><span>Aerial power — overhead line</span></span><span class="flow-key"><i class="is-buried"></i><span>Underground power — buried cable</span></span>'
  }

  private enterInterior(options?: { keepTour?: boolean }) {
    const activity = this.currentActivity
    if (activity?.nocRoom) {
      this.enterNoc(options)
      return
    }
    const root = this.scene.getObjectByName('datacenter')
    if (!activity?.enterInterior || !root) return
    const present = DC_INTERIOR_STEPS.filter((step) => !step.match || this.objectsMatching(root, step.match).length > 0)
    const detailed = present.filter((step) => step.match)
    if (!detailed.length) {
      const summary = document.querySelector('#panel-summary')
      if (summary) {
        summary.textContent =
          'The loaded model does not contain the named equipment for this room. Nothing was added.'
      }
      return
    }
    if (this.isTouring && !options?.keepTour) this.toggleTour()
    if (this.interiorMode) this.exitInterior(false)
    setInteriorVisibility(root, true)
    this.interiorSteps = present.map((step) => ({
      ...step,
      objects: step.match ? this.objectsMatching(root, step.match) : [],
    }))
    this.interiorMode = true
    this.interiorKind = 'dc'
    this.hideInteriorOccluders(root)
    const framed = this.shellBounds(root)
    this.cutaway.apply([root], this.interiorCutHeight(root), (mesh) => !isInteriorName(mesh.name) && !isInteriorName(mesh.parent?.name ?? ''))
    this.atmosphere.enterInteriorMode('cutaway')
    this.interiorOrbit = {
      minPolar: this.controls.minPolarAngle,
      maxPolar: this.controls.maxPolarAngle,
      minDistance: this.controls.minDistance,
      maxDistance: this.controls.maxDistance,
    }
    this.controls.minPolarAngle = 0.02
    this.controls.maxPolarAngle = Math.PI * 0.48
    this.interiorRoomShot = this.roomShot(framed)
    const preferred = this.currentPlaceId === 'continuity' ? 'ups' : this.currentPlaceId === 'racks' ? 'racks' : 'overview'
    const index = Math.max(0, this.interiorSteps.findIndex((step) => step.id === preferred))
    const bar = document.querySelector<HTMLElement>('#interior-bar')
    if (bar) bar.hidden = false
    this.showInteriorStep(index === -1 ? 0 : index, true)
  }

  /** Ops floor from the previous campus: the site is hidden and only the 13-screen room remains. */
  private enterNoc(options?: { keepTour?: boolean }) {
    if (this.isTouring && !options?.keepTour) this.toggleTour()
    if (this.interiorMode) this.exitInterior(false)
    if (!this.nocRoom3d) {
      this.nocRoom3d = new NocInterior()
      this.scene.add(this.nocRoom3d.group)
    }
    this.nocHidden = []
    for (const child of this.scene.children) {
      if (child === this.nocRoom3d.group) continue
      if ((child as THREE.Light).isLight) continue
      if (!child.visible) continue
      child.visible = false
      this.nocHidden.push(child)
    }
    this.nocRoom3d.show()
    this.nocRoom3d.setSelectedMonitor(null)
    this.interiorKind = 'noc'
    this.interiorMode = true
    this.interiorSteps = [
      {
        id: 'overview',
        title: NOC_OVERVIEW.title,
        summary: NOC_OVERVIEW.description,
        points: [...NOC_OVERVIEW.points],
        objects: [],
      },
      ...NOC_MONITOR_SITES.map((site) => ({
        id: site.id,
        title: site.title,
        summary: site.description,
        points: site.metrics.slice(0, 4).map((metric) => `${metric.label} : ${metric.value} ${metric.unit ?? ''}`.trim()),
        objects: [],
      })),
    ]
    this.atmosphere.enterInteriorMode('room')
    this.interiorOrbit = {
      minPolar: this.controls.minPolarAngle,
      maxPolar: this.controls.maxPolarAngle,
      minDistance: this.controls.minDistance,
      maxDistance: this.controls.maxDistance,
    }
    this.controls.minPolarAngle = 0.02
    this.controls.maxPolarAngle = Math.PI * 0.5 - 0.04
    const shot = this.nocRoom3d.computeCameraShot()
    this.interiorRoomShot = {
      position: shot.position,
      target: shot.target,
      fov: shot.fov,
      minDistance: shot.minDistance,
      maxDistance: shot.maxDistance,
    }
    const bar = document.querySelector<HTMLElement>('#interior-bar')
    if (bar) bar.hidden = false
    this.showInteriorStep(0, true)
  }

  /** Same opening as the previous campus: drop the outer shell, the roof plant and the panels sitting on it. */
  private hideInteriorOccluders(root: THREE.Object3D) {
    const exterior = this.scene.getObjectByName('datacenter-exterior')
    if (exterior) this.hideInteriorObject(exterior)
    const room = this.shellBounds(root)
    if (room.isEmpty()) return
    const pad = room.clone()
    pad.min.x -= 2
    pad.min.z -= 2
    pad.max.x += 2
    pad.max.z += 2
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.visible) return
      if (isInteriorName(mesh.name) || isInteriorName(mesh.parent?.name ?? '')) return
      if (/coque/i.test(mesh.name) || /coque/i.test(mesh.parent?.name ?? '')) return
      const box = new THREE.Box3().setFromObject(mesh)
      if (box.isEmpty()) return
      const size = box.getSize(new THREE.Vector3())
      if (size.x > 90 || size.z > 90) return
      const overlaps =
        box.min.x < pad.max.x && box.max.x > pad.min.x && box.min.z < pad.max.z && box.max.z > pad.min.z
      const onRoof = box.min.y > room.min.y + 1.2
      if (!overlaps || !onRoof) return
      this.hideInteriorObject(mesh)
    })
    root.traverse((obj) => {
      if (/rooftop|chiller|toiture|plafond/i.test(obj.name)) this.hideInteriorObject(obj)
    })
  }

  private hideInteriorObject(obj: THREE.Object3D) {
    if (!obj.visible || this.interiorHidden.includes(obj)) return
    obj.visible = false
    this.interiorHidden.push(obj)
  }

  private restoreInteriorOccluders() {
    for (const obj of this.interiorHidden) obj.visible = true
    this.interiorHidden = []
  }

  private shellBounds(root: THREE.Object3D) {
    const box = new THREE.Box3()
    root.traverse((obj) => {
      if (/coque/i.test(obj.name)) box.expandByObject(obj)
    })
    if (box.isEmpty()) return this.interiorBounds()
    return box
  }

  private interiorBounds() {
    const box = new THREE.Box3()
    for (const step of this.interiorSteps) {
      for (const obj of step.objects) box.expandByObject(obj)
    }
    return box
  }

  /** Overhead 3/4 of the technical room, matching the old interior camera. */
  private roomShot(box: THREE.Box3): CameraShot {
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const span = Math.max(size.x, size.z, 12)
    const height = Math.max(18, span * 0.62)
    return {
      position: new THREE.Vector3(center.x, center.y + height, center.z + height * 0.75),
      target: center,
      fov: 42,
      minDistance: 4,
      maxDistance: Math.max(90, height * 2.5),
    }
  }

  private showInteriorStep(index: number, forceFly = false) {
    if (!this.interiorSteps.length) return
    this.interiorIndex = (index + this.interiorSteps.length) % this.interiorSteps.length
    const step = this.interiorSteps[this.interiorIndex]!
    const title = document.querySelector('#interior-title')
    const counter = document.querySelector('#interior-step')
    if (title) title.textContent = step.title
    if (counter) counter.textContent = `${this.interiorIndex + 1} / ${this.interiorSteps.length}`
    const summary = document.querySelector('#panel-summary')
    if (summary) summary.textContent = step.summary
    const list = document.querySelector('#panel-points')
    if (list) list.innerHTML = step.points.map((point) => `<li>${point}</li>`).join('')
    const panelTitle = document.querySelector('#panel-title')
    if (panelTitle) panelTitle.textContent = step.title
    if (this.interiorKind === 'noc') {
      this.nocRoom3d?.setSelectedMonitor(step.id === 'overview' ? null : this.interiorIndex - 1)
    }
    const room = this.interiorRoomShot
    if (!forceFly && step.id !== 'overview' && !step.objects.length) return
    const shot =
      step.id === 'overview' || !step.objects.length
        ? room ?? this.shotForObjects(step.objects, true)
        : this.shotForObjects(step.objects, true)
    this.flyShot(shot)
  }

  private exitInterior(restoreShot = true) {
    if (!this.interiorMode) return
    const root = this.scene.getObjectByName('datacenter')
    this.cutaway.clear()
    this.restoreInteriorOccluders()
    for (const obj of this.nocHidden) obj.visible = true
    this.nocHidden = []
    this.nocRoom3d?.hide()
    this.nocRoom3d?.setSelectedMonitor(null)
    if (root) setInteriorVisibility(root, false)
    this.atmosphere.exitInteriorMode()
    if (this.interiorOrbit) {
      this.controls.minPolarAngle = this.interiorOrbit.minPolar
      this.controls.maxPolarAngle = this.interiorOrbit.maxPolar
      this.controls.minDistance = this.interiorOrbit.minDistance
      this.controls.maxDistance = this.interiorOrbit.maxDistance
      this.interiorOrbit = null
    }
    this.interiorRoomShot = null
    this.interiorKind = null
    this.interiorMode = false
    this.interiorSteps = []
    const bar = document.querySelector<HTMLElement>('#interior-bar')
    if (bar) bar.hidden = true
    if (restoreShot && this.currentActivity) {
      this.openPanel(this.currentActivity)
      this.flyShot(this.shotFor(this.currentActivity, placeById(this.currentActivity, this.currentPlaceId)))
    }
  }

  private objectsMatching(root: THREE.Object3D, pattern: RegExp) {
    const found: THREE.Object3D[] = []
    root.traverse((obj) => {
      if (obj !== root && pattern.test(obj.name)) found.push(obj)
    })
    return found
  }

  private interiorCutHeight(root: THREE.Object3D) {
    const shell = new THREE.Box3()
    let found = false
    root.traverse((obj) => {
      if (!/coque/i.test(obj.name)) return
      shell.expandByObject(obj)
      found = true
    })
    if (!found || shell.isEmpty()) shell.setFromObject(root)
    const height = Math.max(1, shell.max.y - shell.min.y)
    // The roof slab is the top of the shell. A cut a few centimetres under
    // the peak leaves that slab in place, so the room still looks closed.
    return shell.max.y - Math.max(1.6, height * 0.28)
  }

  private shotForObjects(objects: THREE.Object3D[], overhead: boolean): CameraShot {
    const box = new THREE.Box3()
    for (const obj of objects) box.expandByObject(obj)
    if (box.isEmpty()) {
      return this.currentActivity
        ? this.shotFor(this.currentActivity)
        : { position: this.camera.position.clone(), target: this.controls.target.clone(), fov: 42 }
    }
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const radius = Math.max(6, size.length() * 0.55)
    const position = overhead
      ? center.clone().add(new THREE.Vector3(radius * 0.35, radius * 1.15, radius * 0.2))
      : center.clone().add(new THREE.Vector3(radius * 0.85, radius * 0.72, radius * 0.55))
    return {
      position,
      target: center,
      fov: overhead ? 42 : 36,
      minDistance: 3,
      maxDistance: Math.min(172, Math.max(80, radius * 4)),
    }
  }
}
