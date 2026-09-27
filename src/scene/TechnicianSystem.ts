import * as THREE from 'three'

export interface TechnicianData {
  id: string
  name: string
  role: string
  zone: string
  sector: 'solar' | 'telecom' | 'data' | 'poste'
  task: string
  position: [number, number, number] // Blender X, Y, Z
  rotationY: number // Orientation in radians
  helmetColor: string // '#f1c40f' (Yellow), '#ffffff' (White), '#3498db' (Blue), '#e67e22' (Orange)
  vestColor: string // '#dfff00' (Hi-vis fluorescent yellow) or '#ff5500' (Hi-vis safety orange)
  prop: 'tablet' | 'multimeter' | 'clipboard' | 'tools'
  camPos?: [number, number, number]
  isPatrolling?: boolean
  patrolPoints?: Array<[number, number, number]>
}

export const TECHNICIANS: TechnicianData[] = [
  {
    id: 'tech-solar-field',
    name: 'Karim Bennani',
    role: 'Technicien Supérieur Photovoltaïque',
    zone: 'Centrale Photovoltaïque 1 MWc',
    sector: 'solar',
    task: 'Inspection thermographique & mesure d’irradiance GHI',
    position: [-123.5, 277.8, 2.2],
    rotationY: Math.PI * 0.25,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [-120.5, 274.5, 4.2],
  },
  {
    id: 'tech-solar-inverter',
    name: 'Youssef El Amrani',
    role: 'Électrotechnicien Haute Puissance',
    zone: 'Rangée Onduleurs Delta SOLIVIA',
    sector: 'solar',
    task: 'Contrôle tension DC/AC, parafoudres & coffrets Quadro',
    position: [-126.2, 276.1, 1.9],
    rotationY: -Math.PI * 0.6,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'multimeter',
    camPos: [-123.5, 273.2, 3.8],
  },
  {
    id: 'tech-solar-bess',
    name: 'Mehdi Chraibi',
    role: 'Spécialiste BESS & Stockage LiFePO4',
    zone: 'Conteneur BESS Lithium 48V',
    sector: 'solar',
    task: 'Diagnostic BMS, température cellules & climatisation de précision',
    position: [-156.4, 246.2, 2.5],
    rotationY: Math.PI * 0.8,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [-153.2, 243.0, 4.5],
  },
  {
    id: 'tech-solar-tech',
    name: 'Tariq Mansouri',
    role: 'Chef d’Exploitation TGBT & SCADA',
    zone: 'Local Technique Solaire',
    sector: 'solar',
    task: 'Contrôle distribution basse tension, RTU & comptage HTA',
    position: [-141.0, 241.5, 2.6],
    rotationY: Math.PI * 0.4,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'clipboard',
    camPos: [-138.0, 238.5, 4.6],
  },
  {
    id: 'tech-tel-tower',
    name: 'Bilal Haddad',
    role: 'Ingénieur Télécom & Radiofréquences',
    zone: 'Pylône Treillis 41m',
    sector: 'telecom',
    task: 'Audit des faisceaux hertziens, balisage OACI & lignes coaxiales',
    position: [-86.5, 122.8, 2.6],
    rotationY: -Math.PI * 0.45,
    helmetColor: '#3498db',
    vestColor: '#ff5500',
    prop: 'clipboard',
    camPos: [-83.0, 119.5, 4.8],
  },
  {
    id: 'tech-tel-cabinet',
    name: 'Hamza Tahiri',
    role: 'Technicien Énergie Télécom Outdoor',
    zone: 'Shelters & Armoires Énergie 48V',
    sector: 'telecom',
    task: 'Maintenance préventive redresseurs & test banc batteries VRLA',
    position: [-71.2, 126.5, 2.8],
    rotationY: Math.PI * 0.95,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'tools',
    camPos: [-68.0, 123.5, 4.5],
  },
  {
    id: 'tech-fiber-sro',
    name: 'Salma Ouazzani',
    role: 'Experte Fibre Optique & FTTx',
    zone: 'Sous-Répartiteur Optique (SRO)',
    sector: 'telecom',
    task: 'Réflectométrie OTDR & contrôle des soudures fusion 144 FO',
    position: [54.2, 299.8, 1.8],
    rotationY: -Math.PI * 0.1,
    helmetColor: '#ffffff',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [56.8, 296.5, 3.8],
  },
  {
    id: 'tech-data-power',
    name: 'Rachid Belkacem',
    role: 'Ingénieur Génie Électrique DCF',
    zone: 'Énergie Critique & Groupes Électrogènes',
    sector: 'data',
    task: 'Test commutation automatique ATS & banc de décharge UPS 2N',
    position: [-135.5, 199.2, 3.2],
    rotationY: Math.PI * 0.35,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'clipboard',
    camPos: [-132.0, 195.5, 5.0],
  },
  {
    id: 'tech-data-guard',
    name: 'Othmane Senhaji',
    role: 'Superviseur de Site & Sécurité',
    zone: 'Poste de Contrôle & Périmètre CCTV',
    sector: 'data',
    task: 'Supervision biométrie, barrières d’accès & flux caméras IR',
    position: [-92.2, 131.5, 3.8],
    rotationY: -Math.PI * 0.7,
    helmetColor: '#3498db',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [-89.0, 128.0, 5.4],
  },
  {
    id: 'tech-poste-source',
    name: 'Adil Kabbaj',
    role: 'Chef de Poste Haute Tension 60/22 kV',
    zone: 'Poste Source Électrique HT/MT',
    sector: 'poste',
    task: 'Surveillance disjoncteurs SF6, transformateur 1000kVA & SCADA',
    position: [333.2, 303.8, 14.2],
    rotationY: 0,
    helmetColor: '#ffffff',
    vestColor: '#ff5500',
    prop: 'tablet',
    camPos: [336.5, 300.0, 16.5],
  },
  {
    id: 'tech-patrol-solar',
    name: 'Nabil Fassi',
    role: 'Agent de Ronde & Maintenance',
    zone: 'Allée Centrale Solaire',
    sector: 'solar',
    task: 'Ronde pédestre d’inspection visuelle clôture & onduleurs',
    position: [-110.0, 260.0, 2.2],
    rotationY: 0,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'clipboard',
    camPos: [-106.5, 256.5, 4.6],
    isPatrolling: true,
    patrolPoints: [
      [-110.0, 260.0, 2.2],
      [-110.0, 280.0, 2.2],
      [-140.0, 280.0, 2.2],
      [-140.0, 260.0, 2.2],
    ],
  },
  {
    id: 'tech-patrol-telecom',
    name: 'Amine Alaoui',
    role: 'Superviseur Réseau & Voirie',
    zone: 'Boulevard Fibre & Infrastructures',
    sector: 'telecom',
    task: 'Contrôle des chambres souterraines & câbles aériens ADSS',
    position: [20.0, 212.0, 4.2],
    rotationY: 0,
    helmetColor: '#f1c40f',
    vestColor: '#dfff00',
    prop: 'tablet',
    camPos: [23.5, 208.5, 5.8],
    isPatrolling: true,
    patrolPoints: [
      [20.0, 212.0, 4.2],
      [40.0, 250.0, 2.0],
      [55.0, 295.0, 1.8],
      [40.0, 250.0, 2.0],
    ],
  },
]

function blenderToThree(x: number, y: number, z: number) {
  return new THREE.Vector3(x, z, -y)
}

/**
 * Generates realistic high-resolution procedural canvas textures for work apparel,
 * safety vest fabric, reflective 3M stripes, NETIS badges, cargo trousers, and screens.
 */
class TextureGenerator {
  static makeVestTexture(vestColor: string, name: string): THREE.CanvasTexture {
    const size = 1024
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Base Fluorescent Fabric
    ctx.fillStyle = vestColor
    ctx.fillRect(0, 0, size, size)

    // Subtle technical fabric weave / grid noise
    ctx.fillStyle = 'rgba(0,0,0,0.06)'
    for (let y = 0; y < size; y += 4) {
      ctx.fillRect(0, y, size, 1)
    }
    for (let x = 0; x < size; x += 4) {
      ctx.fillRect(x, 0, 1, size)
    }

    // Horizontal 3M Retro-Reflective Silver Stripes (Chest & Waist)
    const stripeColor = '#eef4fc'
    const stripeGlow = '#ffffff'
    const drawStripe = (y: number, h: number) => {
      ctx.fillStyle = stripeColor
      ctx.fillRect(0, y, size, h)
      ctx.fillStyle = stripeGlow
      ctx.fillRect(0, y + h * 0.25, size, h * 0.5)
      // Stitched edge lines
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'
      ctx.setLineDash([6, 4])
      ctx.lineWidth = 2
      ctx.strokeRect(0, y, size, h)
      ctx.setLineDash([])
    }

    drawStripe(size * 0.35, size * 0.08)
    drawStripe(size * 0.65, size * 0.08)

    // Vertical reflective braces over shoulders
    ctx.fillStyle = stripeColor
    ctx.fillRect(size * 0.18, 0, size * 0.1, size)
    ctx.fillRect(size * 0.72, 0, size * 0.1, size)

    // Central Heavy Duty Zipper (Front)
    ctx.fillStyle = '#111822'
    ctx.fillRect(size * 0.485, 0, size * 0.03, size)
    ctx.strokeStyle = '#8899aa'
    ctx.lineWidth = 2
    for (let y = 0; y < size; y += 8) {
      ctx.beginPath()
      ctx.moveTo(size * 0.485, y)
      ctx.lineTo(size * 0.515, y)
      ctx.stroke()
    }

    // Chest ID Badge Card Holder (Transparent vinyl with NETIS ID)
    const badgeX = size * 0.22
    const badgeY = size * 0.46
    const badgeW = size * 0.2
    const badgeH = size * 0.14

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH)
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 3
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH)

    // Badge Header
    ctx.fillStyle = '#0a2540'
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH * 0.28)
    ctx.fillStyle = '#3ec6ff'
    ctx.font = 'bold 16px Outfit, sans-serif'
    ctx.fillText('NETIS GROUP', badgeX + 8, badgeY + badgeH * 0.2)

    // Badge Name
    ctx.fillStyle = '#111822'
    ctx.font = 'bold 15px Outfit, sans-serif'
    ctx.fillText(name.split(' ')[0] || 'TECH', badgeX + 8, badgeY + badgeH * 0.55)
    ctx.font = '12px Outfit, sans-serif'
    ctx.fillStyle = '#667788'
    ctx.fillText('SERVICES TECHNIQUES', badgeX + 8, badgeY + badgeH * 0.78)

    // Back Branding Text: "NETIS — SERVICES TECHNIQUES"
    ctx.fillStyle = '#061424'
    ctx.font = '800 36px Syne, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('NETIS', size * 0.5, size * 0.22)
    ctx.font = '600 18px Outfit, sans-serif'
    ctx.fillText('SERVICES TECHNIQUES', size * 0.5, size * 0.27)
    ctx.textAlign = 'start'

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.needsUpdate = true
    return tex
  }

  static makePantsTexture(): THREE.CanvasTexture {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Deep Navy Work Pants Fabric
    ctx.fillStyle = '#182434'
    ctx.fillRect(0, 0, size, size)

    // Diagonal twill weave
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let i = -size; i < size * 2; i += 4) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + size, size)
      ctx.stroke()
    }

    // Heavy reinforced knee patches in dark charcoal
    ctx.fillStyle = '#0e151e'
    ctx.fillRect(size * 0.1, size * 0.38, size * 0.8, size * 0.24)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 2
    ctx.strokeRect(size * 0.1, size * 0.38, size * 0.8, size * 0.24)
    ctx.setLineDash([])

    // Cargo pocket flap
    ctx.fillStyle = '#121b27'
    ctx.fillRect(size * 0.15, size * 0.18, size * 0.7, size * 0.12)
    ctx.strokeStyle = '#223246'
    ctx.strokeRect(size * 0.15, size * 0.18, size * 0.7, size * 0.12)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.needsUpdate = true
    return tex
  }

  static makeTabletScreenTexture(): THREE.CanvasTexture {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Dark SCADA Dashboard Theme
    ctx.fillStyle = '#081320'
    ctx.fillRect(0, 0, size, size)

    // Top Status Header
    ctx.fillStyle = '#0d2238'
    ctx.fillRect(0, 0, size, 56)
    ctx.fillStyle = '#3ec6ff'
    ctx.font = 'bold 20px Outfit, sans-serif'
    ctx.fillText('NETIS LIVE SCADA 24/7', 18, 36)
    ctx.fillStyle = '#2ecc71'
    ctx.font = '16px "JetBrains Mono", monospace'
    ctx.fillText('ONLINE ●', size - 110, 36)

    // Telemetry Gauges & Waves
    ctx.strokeStyle = 'rgba(62, 198, 255, 0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(18, 74, size - 36, 160)

    // Sine wave line (Grid Frequency & Power)
    ctx.strokeStyle = '#3ec6ff'
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let x = 20; x < size - 20; x++) {
      const y = 154 + Math.sin((x - 20) * 0.04) * 35 + Math.sin((x - 20) * 0.12) * 12
      if (x === 20) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Key Values
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 36px Outfit, sans-serif'
    ctx.fillText('784.5 kW', 30, 120)
    ctx.fillStyle = '#8aa0ae'
    ctx.font = '18px Outfit, sans-serif'
    ctx.fillText('PUISSANCE ACTIVE', 30, 145)

    // KPI Cards bottom
    const drawKpi = (x: number, y: number, w: number, h: number, label: string, val: string, color: string) => {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.strokeRect(x, y, w, h)
      ctx.fillStyle = '#8aa0ae'
      ctx.font = '14px Outfit, sans-serif'
      ctx.fillText(label, x + 12, y + 26)
      ctx.fillStyle = color
      ctx.font = 'bold 22px Outfit, sans-serif'
      ctx.fillText(val, x + 12, y + 60)
    }

    drawKpi(18, 250, (size - 48) / 2, 80, 'TENSION RÉSEAU', '20.4 kV', '#ffffff')
    drawKpi(26 + (size - 48) / 2, 250, (size - 48) / 2, 80, 'IRRADIANCE GHI', '1 042 W/m²', '#f5b942')

    drawKpi(18, 345, (size - 48) / 2, 80, 'TEMP. BESS', '22.8 °C', '#2ecc71')
    drawKpi(26 + (size - 48) / 2, 345, (size - 48) / 2, 80, 'SLA SITE', '99.98 %', '#3ec6ff')

    // Bottom progress bar
    ctx.fillStyle = '#2ecc71'
    ctx.fillRect(18, 445, size - 36, 12)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }

  static makeMultimeterTexture(): THREE.CanvasTexture {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Rugged Fluke Yellow body
    ctx.fillStyle = '#f39c12'
    ctx.fillRect(0, 0, size, size)

    // Dark Rubber Holster edges
    ctx.fillStyle = '#1c222a'
    ctx.fillRect(0, 0, 16, size)
    ctx.fillRect(size - 16, 0, 16, size)
    ctx.fillRect(0, 0, size, 16)
    ctx.fillRect(0, size - 16, size, 16)

    // Backlit LCD Display
    ctx.fillStyle = '#a8e6cf'
    ctx.fillRect(32, 32, size - 64, 80)
    ctx.strokeStyle = '#1c222a'
    ctx.lineWidth = 3
    ctx.strokeRect(32, 32, size - 64, 80)

    // Digits
    ctx.fillStyle = '#062615'
    ctx.font = 'bold 36px "JetBrains Mono", monospace'
    ctx.fillText('398.2', 46, 85)
    ctx.font = 'bold 18px "JetBrains Mono", monospace'
    ctx.fillText('V AC ~', size - 100, 85)

    // Rotary Dial
    ctx.fillStyle = '#1c222a'
    ctx.beginPath()
    ctx.arc(size / 2, 170, 36, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(size / 2, 170)
    ctx.lineTo(size / 2, 140)
    ctx.stroke()

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }
}

/**
 * Procedural Realistic Human Technician with anatomical contours,
 * PBR fabric & safety gear shaders, realistic props, and organic kinematics.
 */
export class TechnicianSystem {
  readonly group = new THREE.Group()
  private readonly technicians: Array<{
    data: TechnicianData
    root: THREE.Group
    head: THREE.Group
    neck: THREE.Group
    torso: THREE.Group
    leftArm: THREE.Group
    leftForearm: THREE.Group
    rightArm: THREE.Group
    rightForearm: THREE.Group
    leftLeg: THREE.Group
    leftShin: THREE.Group
    rightLeg: THREE.Group
    rightShin: THREE.Group
    idlePhase: number
    lookPhase: number
    patrolIndex: number
    patrolProgress: number
    groundY: number
  }> = []

  private sharedMaterials: Record<string, THREE.Material> = {}
  private pantsTexture: THREE.CanvasTexture | null = null
  private tabletTexture: THREE.CanvasTexture | null = null
  private multimeterTexture: THREE.CanvasTexture | null = null
  private raycaster = new THREE.Raycaster()

  init(scene: THREE.Scene) {
    this.group.name = 'campus-technicians'
    this.pantsTexture = TextureGenerator.makePantsTexture()
    this.tabletTexture = TextureGenerator.makeTabletScreenTexture()
    this.multimeterTexture = TextureGenerator.makeMultimeterTexture()

    this.initSharedMaterials()
    this.spawnTechnicians(scene)
    scene.add(this.group)
    console.info(`[campus] technician system initialized: ${this.technicians.length} field engineers active`)
  }

  private initSharedMaterials() {
    // Realistic Human Skin Shader
    this.sharedMaterials.skin = new THREE.MeshStandardMaterial({
      color: 0xdfa07a,
      roughness: 0.65,
      metalness: 0.05,
    })

    // Work Trousers with Cargo Pockets & Twill Map
    this.sharedMaterials.pants = new THREE.MeshStandardMaterial({
      map: this.pantsTexture,
      roughness: 0.85,
      metalness: 0.05,
    })

    // Heavy Leather Work Boots
    this.sharedMaterials.boots = new THREE.MeshStandardMaterial({
      color: 0x1a1512,
      roughness: 0.7,
      metalness: 0.15,
    })

    // Heavy Duty Work Gloves
    this.sharedMaterials.gloves = new THREE.MeshStandardMaterial({
      color: 0x222e3c,
      roughness: 0.8,
      metalness: 0.1,
    })

    // Wrap-Around Tinted Safety Sunglasses
    this.sharedMaterials.sunglasses = new THREE.MeshPhysicalMaterial({
      color: 0x081018,
      roughness: 0.1,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 2.0,
    })

    // Rugged Device Casing
    this.sharedMaterials.deviceCase = new THREE.MeshStandardMaterial({
      color: 0x11161d,
      roughness: 0.35,
      metalness: 0.4,
    })

    // Silver Reflective Tape
    this.sharedMaterials.reflective = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0x99aabb,
      emissiveIntensity: 0.25,
    })
  }

  private snapToGround(x: number, z: number, defaultY: number, scene: THREE.Scene): number {
    const origin = new THREE.Vector3(x, 80, z)
    const down = new THREE.Vector3(0, -1, 0)
    this.raycaster.set(origin, down)
    this.raycaster.far = 140

    const targets: THREE.Object3D[] = []
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.geometry || mesh.name === 'sky' || mesh.userData.decoy) return
      if (mesh.name.includes('technician')) return
      targets.push(mesh)
    })

    const hits = this.raycaster.intersectObjects(targets, false)
    if (hits.length > 0) {
      for (const hit of hits) {
        if (hit.point.y < 50 && hit.point.y > -5) {
          return hit.point.y
        }
      }
    }
    return defaultY
  }

  private spawnTechnicians(scene: THREE.Scene) {
    for (const data of TECHNICIANS) {
      const tech = this.buildRealisticTechnician(data)
      const worldPos = blenderToThree(...data.position)

      const groundY = this.snapToGround(worldPos.x, worldPos.z, worldPos.y, scene)
      worldPos.y = groundY
      tech.root.position.copy(worldPos)
      tech.root.rotation.y = data.rotationY

      this.group.add(tech.root)
      this.technicians.push({
        data,
        ...tech,
        groundY,
        idlePhase: Math.random() * Math.PI * 2,
        lookPhase: Math.random() * Math.PI * 2,
        patrolIndex: 0,
        patrolProgress: 0,
      })
    }
  }

  /**
   * Constructs an anatomically proportional, smoothly sculpted realistic 3D human character.
   */
  private buildRealisticTechnician(data: TechnicianData) {
    const root = new THREE.Group()
    root.name = `technician:${data.id}`
    root.userData.technician = data

    // Natural human height (≈ 1.80m)
    const scale = 1.0
    root.scale.set(scale, scale, scale)

    // Vest material with customized high-res texture & ID badge
    const vestTex = TextureGenerator.makeVestTexture(data.vestColor, data.name)
    const vestMat = new THREE.MeshStandardMaterial({
      map: vestTex,
      roughness: 0.65,
      metalness: 0.05,
      bumpScale: 0.02,
    })

    // Glossy Industrial Safety Hard Hat Helmet
    const helmetMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(data.helmetColor),
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      envMapIntensity: 1.6,
    })

    // Pelvis / Hips (y ≈ 0.98m)
    const pelvis = new THREE.Group()
    pelvis.position.y = 0.98
    root.add(pelvis)

    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.18, 16), this.sharedMaterials.pants)
    pelvisMesh.castShadow = true
    pelvis.add(pelvisMesh)

    // Torso & Chest Group (Anatomical taper from waist to shoulders)
    const torso = new THREE.Group()
    torso.position.y = 0.09
    pelvis.add(torso)

    // Ergonomic Torso Lathe / Loft
    const torsoPoints = [
      new THREE.Vector2(0.14, 0.0),   // Waist
      new THREE.Vector2(0.16, 0.15),  // Mid torso
      new THREE.Vector2(0.20, 0.32),  // Chest
      new THREE.Vector2(0.22, 0.42),  // Shoulders
      new THREE.Vector2(0.10, 0.45),  // Clavicle / Neck base
    ]
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 20)
    torsoGeo.scale(1.15, 1.0, 0.75) // Flatter chest/back profile
    const torsoMesh = new THREE.Mesh(torsoGeo, vestMat)
    torsoMesh.castShadow = true
    torso.add(torsoMesh)

    // Belt with buckle & radio holster
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.165, 0.045, 20),
      this.sharedMaterials.boots,
    )
    belt.scale.set(1.12, 1.0, 0.8)
    belt.position.y = 0.02
    torso.add(belt)

    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.035, 0.02),
      this.sharedMaterials.reflective,
    )
    buckle.position.set(0, 0.02, 0.14)
    torso.add(buckle)

    // Shoulder Radio Transceiver with Antenna
    const radio = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.09, 0.035), this.sharedMaterials.deviceCase)
    radio.position.set(0.16, 0.36, 0.08)
    radio.rotation.z = -0.15
    torso.add(radio)

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.09), this.sharedMaterials.deviceCase)
    antenna.position.set(0.17, 0.44, 0.08)
    torso.add(antenna)

    // Neck & Head
    const neck = new THREE.Group()
    neck.position.y = 0.45
    torso.add(neck)

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.09, 14), this.sharedMaterials.skin)
    neckMesh.position.y = 0.04
    neck.add(neckMesh)

    const head = new THREE.Group()
    head.position.y = 0.1
    neck.add(head)

    // Head Sculpt (Cranium + Jaw)
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 16), this.sharedMaterials.skin)
    cranium.scale.set(0.9, 1.05, 1.0)
    cranium.castShadow = true
    head.add(cranium)

    // Jaw / Chin
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.09), this.sharedMaterials.skin)
    jaw.position.set(0, -0.04, 0.03)
    head.add(jaw)

    // Ears
    const leftEar = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.035, 0.02), this.sharedMaterials.skin)
    leftEar.position.set(-0.095, 0, 0)
    head.add(leftEar)
    const rightEar = leftEar.clone()
    rightEar.position.x = 0.095
    head.add(rightEar)

    // MSA V-Gard Style Industrial Safety Hard Hat
    const helmetDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.58),
      helmetMat,
    )
    helmetDome.scale.set(0.95, 1.0, 1.1)
    helmetDome.position.set(0, 0.03, -0.01)
    helmetDome.castShadow = true
    head.add(helmetDome)

    // Top Reinforcing Ridge / Crest
    const helmetCrest = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.22), helmetMat)
    helmetCrest.position.set(0, 0.14, -0.01)
    helmetCrest.rotation.x = -0.05
    head.add(helmetCrest)

    // Flared Front Peak & All-around Brim
    const helmetBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.012, 22), helmetMat)
    helmetBrim.scale.set(0.95, 1.0, 1.18)
    helmetBrim.position.set(0, 0.025, 0.01)
    helmetBrim.rotation.x = -0.08
    head.add(helmetBrim)

    // Wrap-Around Tinted Safety Glasses
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.06), this.sharedMaterials.sunglasses)
    glasses.position.set(0, 0.01, 0.085)
    head.add(glasses)

    // Limbs - Arms (Left & Right)
    const leftArm = new THREE.Group()
    leftArm.position.set(-0.24, 0.38, 0)
    torso.add(leftArm)

    const rightArm = new THREE.Group()
    rightArm.position.set(0.24, 0.38, 0)
    torso.add(rightArm)

    // Left Arm (Bicep & Forearm with elbow joint)
    const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.26, 14), vestMat)
    leftBicep.position.y = -0.13
    leftBicep.castShadow = true
    leftArm.add(leftBicep)

    const leftForearm = new THREE.Group()
    leftForearm.position.y = -0.26
    leftArm.add(leftForearm)

    const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.25, 14), this.sharedMaterials.pants)
    leftForearmMesh.position.y = -0.125
    leftForearmMesh.castShadow = true
    leftForearm.add(leftForearmMesh)

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.03), this.sharedMaterials.gloves)
    leftHand.position.set(0, -0.27, 0)
    leftForearm.add(leftHand)

    // Right Arm
    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.26, 14), vestMat)
    rightBicep.position.y = -0.13
    rightBicep.castShadow = true
    rightArm.add(rightBicep)

    const rightForearm = new THREE.Group()
    rightForearm.position.y = -0.26
    rightArm.add(rightForearm)

    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.25, 14), this.sharedMaterials.pants)
    rightForearmMesh.position.y = -0.125
    rightForearmMesh.castShadow = true
    rightForearm.add(rightForearmMesh)

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.03), this.sharedMaterials.gloves)
    rightHand.position.set(0, -0.27, 0)
    rightForearm.add(rightHand)

    // Limbs - Legs (Left & Right)
    const leftLeg = new THREE.Group()
    leftLeg.position.set(-0.11, -0.05, 0)
    pelvis.add(leftLeg)

    const rightLeg = new THREE.Group()
    rightLeg.position.set(0.11, -0.05, 0)
    pelvis.add(rightLeg)

    // Left Thigh
    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.42, 16), this.sharedMaterials.pants)
    leftThigh.position.y = -0.21
    leftThigh.castShadow = true
    leftLeg.add(leftThigh)

    const leftShin = new THREE.Group()
    leftShin.position.y = -0.42
    leftLeg.add(leftShin)

    const leftShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.052, 0.4, 16), this.sharedMaterials.pants)
    leftShinMesh.position.y = -0.2
    leftShinMesh.castShadow = true
    leftShin.add(leftShinMesh)

    // Left Work Boot (Contoured ankle, steel toe cap, lug tread sole)
    const leftBoot = new THREE.Group()
    leftBoot.position.set(0, -0.42, 0.03)
    leftShin.add(leftBoot)

    const leftBootUpper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.21), this.sharedMaterials.boots)
    leftBootUpper.position.set(0, 0.05, 0.03)
    leftBootUpper.castShadow = true
    leftBoot.add(leftBootUpper)

    const leftBootSole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.23), this.sharedMaterials.deviceCase)
    leftBootSole.position.set(0, 0.0, 0.03)
    leftBootSole.castShadow = true
    leftBoot.add(leftBootSole)

    // Right Leg
    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.42, 16), this.sharedMaterials.pants)
    rightThigh.position.y = -0.21
    rightThigh.castShadow = true
    rightLeg.add(rightThigh)

    const rightShin = new THREE.Group()
    rightShin.position.y = -0.42
    rightLeg.add(rightShin)

    const rightShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.052, 0.4, 16), this.sharedMaterials.pants)
    rightShinMesh.position.y = -0.2
    rightShinMesh.castShadow = true
    rightShin.add(rightShinMesh)

    const rightBoot = new THREE.Group()
    rightBoot.position.set(0, -0.42, 0.03)
    rightShin.add(rightBoot)

    const rightBootUpper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.21), this.sharedMaterials.boots)
    rightBootUpper.position.set(0, 0.05, 0.03)
    rightBootUpper.castShadow = true
    rightBoot.add(rightBootUpper)

    const rightBootSole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.23), this.sharedMaterials.deviceCase)
    rightBootSole.position.set(0, 0.0, 0.03)
    rightBootSole.castShadow = true
    rightBoot.add(rightBootSole)

    // Working Props & Ergonomic Poses
    if (data.prop === 'tablet') {
      // Natural two-handed diagnostic tablet pose in front of chest
      leftArm.rotation.set(0.65, 0.2, 0.25)
      leftForearm.rotation.set(-1.15, -0.2, -0.35)

      rightArm.rotation.set(0.65, -0.2, -0.25)
      rightForearm.rotation.set(-1.15, 0.2, 0.35)

      const tabletGroup = new THREE.Group()
      tabletGroup.position.set(0.08, -0.26, 0.08)
      tabletGroup.rotation.set(-0.35, 0.15, -0.1)
      leftForearm.add(tabletGroup)

      const tabletBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.016), this.sharedMaterials.deviceCase)
      tabletGroup.add(tabletBody)

      const tabletScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.16),
        new THREE.MeshBasicMaterial({ map: this.tabletTexture }),
      )
      tabletScreen.position.z = 0.009
      tabletGroup.add(tabletScreen)
    } else if (data.prop === 'multimeter') {
      // Left hand holding Fluke multimeter, right hand holding voltage test probe
      leftArm.rotation.set(0.55, 0.1, 0.15)
      leftForearm.rotation.set(-0.95, -0.1, -0.2)

      rightArm.rotation.set(0.7, -0.25, -0.3)
      rightForearm.rotation.set(-0.6, 0.15, 0.2)

      const meterGroup = new THREE.Group()
      meterGroup.position.set(0.04, -0.26, 0.06)
      meterGroup.rotation.set(-0.4, 0, 0)
      leftForearm.add(meterGroup)

      const meterBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.19, 0.045),
        new THREE.MeshStandardMaterial({ map: this.multimeterTexture, roughness: 0.4 }),
      )
      meterGroup.add(meterBody)

      // Test probe with flexible insulated cable
      const probe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.003, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.3 }),
      )
      probe.position.set(0, -0.28, 0.08)
      probe.rotation.x = 1.1
      rightForearm.add(probe)
    } else if (data.prop === 'clipboard') {
      // Left arm tucks clipboard, right hand holds inspection pen
      leftArm.rotation.set(0.35, 0.15, 0.1)
      leftForearm.rotation.set(-0.7, -0.1, -0.15)

      rightArm.rotation.set(0.45, -0.2, -0.1)
      rightForearm.rotation.set(-0.55, 0.1, 0.15)

      const boardGroup = new THREE.Group()
      boardGroup.position.set(0.06, -0.24, 0.06)
      boardGroup.rotation.set(-0.45, 0.2, -0.1)
      leftForearm.add(boardGroup)

      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.28, 0.012),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 }),
      )
      boardGroup.add(board)

      const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(0.19, 0.24),
        new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.9 }),
      )
      paper.position.z = 0.008
      boardGroup.add(paper)

      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.018), this.sharedMaterials.reflective)
      clip.position.set(0, 0.12, 0.012)
      boardGroup.add(clip)
    } else {
      // Tools & relaxed inspection stance
      leftArm.rotation.set(0.2, 0.05, 0.1)
      leftForearm.rotation.set(-0.35, 0, 0)

      rightArm.rotation.set(0.55, -0.15, -0.2)
      rightForearm.rotation.set(-0.75, 0.1, 0.1)

      const tool = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.006, 0.22),
        this.sharedMaterials.reflective,
      )
      tool.position.set(0, -0.28, 0.08)
      tool.rotation.x = 0.8
      rightForearm.add(tool)
    }

    return {
      root,
      head,
      neck,
      torso,
      leftArm,
      leftForearm,
      rightArm,
      rightForearm,
      leftLeg,
      leftShin,
      rightLeg,
      rightShin,
    }
  }

  getTechniciansList() {
    return TECHNICIANS
  }

  getTechnicianById(id: string) {
    return TECHNICIANS.find((t) => t.id === id)
  }

  update(dt: number) {
    const time = performance.now() * 0.001

    for (const tech of this.technicians) {
      tech.idlePhase += dt * 1.4
      tech.lookPhase += dt * 0.35

      // Natural breathing chest heave
      const breath = Math.sin(tech.idlePhase) * 0.014
      tech.torso.position.y = 0.09 + breath * 0.5
      tech.torso.scale.set(1.15 + breath * 0.4, 1.0, 0.75 + breath * 0.4)

      // Smooth subtle head inspection scanning
      const lookYaw = Math.sin(tech.lookPhase) * 0.28 + Math.sin(tech.lookPhase * 1.7) * 0.12
      const lookPitch = Math.cos(tech.lookPhase * 0.7) * 0.08 + 0.06
      tech.head.rotation.y = lookYaw
      tech.head.rotation.x = lookPitch

      // Patrol movement for mobile technicians
      if (tech.data.isPatrolling && tech.data.patrolPoints && tech.data.patrolPoints.length >= 2) {
        const points = tech.data.patrolPoints
        const speed = 0.95 // m/s natural walking speed
        const currentPt = points[tech.patrolIndex]!
        const nextPt = points[(tech.patrolIndex + 1) % points.length]!

        const pA = blenderToThree(...currentPt)
        const pB = blenderToThree(...nextPt)
        pA.y = tech.groundY
        pB.y = tech.groundY
        const segmentDist = pA.distanceTo(pB)

        tech.patrolProgress += (speed * dt) / Math.max(0.1, segmentDist)
        if (tech.patrolProgress >= 1) {
          tech.patrolProgress = 0
          tech.patrolIndex = (tech.patrolIndex + 1) % points.length
        }

        tech.root.position.lerpVectors(pA, pB, tech.patrolProgress)

        const dir = new THREE.Vector3().subVectors(pB, pA).normalize()
        if (dir.lengthSq() > 1e-4) {
          const targetAngle = Math.atan2(dir.x, dir.z)
          tech.root.rotation.y = targetAngle
        }

        // Natural walking kinematics (leg swing & knee flex)
        const walkCycle = time * 4.8
        const legSwing = Math.sin(walkCycle) * 0.38
        const kneeFlex = Math.max(0, Math.sin(walkCycle + Math.PI * 0.5)) * 0.4
        const kneeFlexOpp = Math.max(0, Math.sin(walkCycle - Math.PI * 0.5)) * 0.4

        tech.leftLeg.rotation.x = legSwing
        tech.leftShin.rotation.x = kneeFlex
        tech.rightLeg.rotation.x = -legSwing
        tech.rightShin.rotation.x = kneeFlexOpp

        // Pelvis slight bounce
        tech.torso.position.y = 0.09 + Math.abs(Math.sin(walkCycle * 2)) * 0.02
      }
    }
  }
}
