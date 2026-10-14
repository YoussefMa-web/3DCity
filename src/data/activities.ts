import { applyActivityDetails } from './activityDetails'

export type BrandId = 'telecom' | 'energies' | 'managed'

export interface ActivityStat {
  value: string
  label: string
}

export interface ActivityPlace {
  id: string
  title: string
  summary: string
  points: string[]
  benefits?: string[]
  anchor: [number, number, number]
  cam: [number, number, number]
  target: [number, number, number]
  fov?: number
  minDistance?: number
  maxDistance?: number
  flowKind?: 'fiber' | 'power'
}

export interface Activity {
  id: string
  brand: BrandId
  title: string
  kicker: string
  summary: string
  points: string[]
  stats?: ActivityStat[]
  benefits?: string[]
  /** Affiche le panneau salle NOC (écrans, SLA, inventaire). */
  nocRoom?: boolean
  /** Coupe et visite de la salle déjà contenue dans le modèle. */
  enterInterior?: boolean
  flowKind?: 'fiber' | 'power'
  fov?: number
  minDistance?: number
  maxDistance?: number
  places?: ActivityPlace[]
  icon: string
  /** Blender Z-up anchor. */
  anchor: [number, number, number]
  /** Blender Z-up camera. */
  cam: [number, number, number]
  target: [number, number, number]
}

export interface Brand {
  id: BrandId
  name: string
  tagline: string
  color: string
  icon: string
}

export const BRANDS: Brand[] = [
  {
    id: 'telecom',
    name: 'NETIS TELECOM & DATA',
    tagline: 'Networks, fibre and data center',
    color: '#3ec6ff',
    icon: 'tower',
  },
  {
    id: 'energies',
    name: 'NETIS ENERGIES',
    tagline: 'Generate, store, supply',
    color: '#f5b942',
    icon: 'bolt',
  },
  {
    id: 'managed',
    name: 'NETIS MANAGED SERVICES',
    tagline: '24/7 supervision and operations',
    color: '#7c8cff',
    icon: 'noc',
  },
]

export const ACTIVITIES: Activity[] = [
  {
    id: 'solar-field',
    brand: 'energies',
    title: 'Photovoltaic plant',
    kicker: 'Generation · ≈ 1 MWc',
    summary:
      'Ground-mounted 997.9 kWc plant: 3,168 modules of 315 Wc, fixed structures, inverters, string boxes, MV substation and SCADA. Expected output ≈ 1,700 MWh/year and 1,220 tCO₂/year avoided.',
    points: [
      '3,168 modules × 315 Wc = 997.9 kWc',
      '25-year linear power warranty',
      'Strings into string boxes and central inverters',
      'End-to-end EPC, no subcontracting',
    ],
    stats: [
      { value: '997.9 kWc', label: 'Capacity' },
      { value: '3,168', label: 'Modules' },
      { value: '1,700 MWh', label: '/ year' },
    ],
    icon: 'sun',
    anchor: [-123.9, 280.2, 2.2],
    cam: [-70, 220, 55],
    target: [-124, 280, 2],
  },
  {
    id: 'solar-roof',
    brand: 'energies',
    title: 'Rooftop photovoltaic',
    kicker: 'Data center roof',
    summary:
      'Photovoltaic array on the data center roof, above the technical hall and beside the rooftop chillers. This is not the delivery substation.',
    points: [
      'Modules laid on the data center roof',
      'Separate from the 1,000 kVA delivery substation',
      'Rooftop chillers sit on the same roof',
      'Production joins the campus power chain',
    ],
    stats: [
      { value: 'Roof', label: 'Data center' },
      { value: 'PV', label: 'Modules' },
    ],
    icon: 'sun',
    anchor: [-167.9, 202.8, 13.2],
    cam: [-110, 160, 28],
    target: [-168, 203, 13],
  },
  {
    id: 'solar-inverter',
    brand: 'energies',
    title: 'Inverters and conversion',
    kicker: 'Conversion · 11 inverters',
    summary:
      'DC to AC conversion of the strings. 11 industrial inverters (Delta SOLIVIA) in rows, 44 cabinets (string boxes + Quadro AC), supervision and fault detection.',
    points: [
      'High DC to AC efficiency, automatic alarms',
      'DC aggregation, surge arresters and AC/DC disconnects',
      'String-level telemetry',
      'Direct connection to the Quadro AC cabinet',
    ],
    stats: [
      { value: '11', label: 'Inverters' },
      { value: '44', label: 'Cabinets' },
    ],
    icon: 'bolt',
    anchor: [-124.8, 276.6, 1.8],
    cam: [-90, 250, 18],
    target: [-125, 277, 1.6],
  },
  {
    id: 'solar-bess',
    brand: 'energies',
    title: 'BESS storage',
    kicker: 'Storage · ISO container',
    summary:
      'Containerised lithium storage: smoothing, peak shaving and backup, coupled to the plant and the LV switchboard. Insulated container, 378 ventilation grilles, 8 LiFePO4 48 V racks.',
    points: [
      'ISO enclosure, rack compartments and fire aerosol',
      'Bidirectional PCS and BMS',
      '48 V DC cooling and cell thermal monitoring',
      'Hybrid solar microgrid and grid stabilisation',
    ],
    stats: [
      { value: '48 V', label: 'DC bus' },
      { value: '8 racks', label: 'LiFePO4' },
      { value: '14.5 h', label: 'Typical autonomy' },
    ],
    icon: 'battery',
    anchor: [-157.8, 247.1, 2.4],
    cam: [-120, 220, 22],
    target: [-158, 247, 2],
  },
  {
    id: 'solar-tech',
    brand: 'energies',
    title: 'Technical room',
    kicker: 'Operations · 4 racks',
    summary:
      'Control room: AC LV switchboard, SCADA RTU, MV/LV metering and precision split cooling. Semi-transparent envelope, 290 modelled elements.',
    points: [
      'AC LV switchboard and low-voltage distribution',
      'SCADA / telemetry gateway',
      'Metering and grid decoupling',
      'Split cooling for the electronics',
    ],
    stats: [
      { value: '4', label: 'Racks' },
      { value: '290', label: '3D elements' },
    ],
    icon: 'building',
    anchor: [-142.2, 242.5, 3.2],
    cam: [-110, 220, 16],
    target: [-142, 243, 2.5],
  },
  {
    id: 'solar-delivery',
    brand: 'energies',
    title: 'Delivery substation',
    kicker: 'Connection · 1,000 kVA',
    summary:
      'MV substation: 1,000 kVA transformer, switchgear, metering, decoupling relay. Dual feed from the solar plant and the data center. 80 elements.',
    points: [
      'LV to MV step-up, 1,000 kVA',
      'MV cubicles and decoupling metering',
      'Dual feeder: plant / data center',
      'Shared interface with the grid',
    ],
    stats: [
      { value: '1,000 kVA', label: 'Transformer' },
      { value: '80', label: 'Elements' },
    ],
    icon: 'grid',
    anchor: [-200.7, 226.1, 2.5],
    cam: [-170, 255, 12],
    target: [-201, 226, 2.5],
  },
  {
    id: 'solar-source',
    brand: 'energies',
    title: '60/22 kV source substation',
    kicker: 'Grid · 131 × 71 m',
    summary:
      'Full HV source substation (131 × 71 m, 32 m high): gantries, HV/MV switchgear, transformers, civil works. 6,539 elements.',
    points: [
      'HV transformation and MV distribution',
      'Switchgear on galvanised gantries',
      'Foundations, trenches, fence',
      'SCADA, protection and NOC telemetry',
    ],
    stats: [
      { value: '131 × 71 m', label: 'Footprint' },
      { value: '32 m', label: 'Height' },
      { value: '6,539', label: 'Elements' },
    ],
    icon: 'grid',
    anchor: [116.8, 188.5, 16],
    cam: [30, 100, 55],
    target: [116.8, 188.5, 8],
  },
  {
    id: 'solar-carport',
    brand: 'energies',
    title: 'Solar canopies',
    kicker: 'Carport · 98 modules',
    summary:
      'Parking canopies and EV hub: 98 modules, 156 steel structure parts, L2 / DC Fast chargers, dynamic energy management.',
    points: [
      'Shade and use of the parking area',
      'L2 and DC Fast charging',
      'Self-consumption and grid / BESS coupling',
      '20-year anti-corrosion structures',
    ],
    stats: [
      { value: '98', label: 'Modules' },
      { value: '156', label: 'Steel parts' },
    ],
    icon: 'carport',
    anchor: [-65.5, 214.1, 2.4],
    cam: [-30, 185, 22],
    target: [-66, 214, 2],
  },
  {
    id: 'solar-meteo',
    brand: 'energies',
    title: 'Weather and irradiance station',
    kicker: 'Measurement · live PR',
    summary:
      'Reference station: class A pyranometers, reference PV cell, module and ambient probes, anemometer. Computes the performance ratio live.',
    points: [
      'Class A pyranometers and reference cell',
      'Module and ambient temperature probes',
      'Ultrasonic anemometer and wind vane',
      'GHI atlas up to 1,200 W/m²',
    ],
    stats: [
      { value: 'Class A', label: 'Pyranometers' },
      { value: '1,040 W/m²', label: 'Typical GHI' },
    ],
    icon: 'sun',
    anchor: [-200.0, 280.9, 2.0],
    cam: [-208, 272, 5.5],
    target: [-200, 280.9, 2],
  },
  {
    id: 'solar-light',
    brand: 'energies',
    title: 'Solar street lighting',
    kicker: 'City · night autonomy',
    summary:
      'Standalone columns: integrated PV, battery, astronomical clock and photocell. No grid pull.',
    points: [
      'PV head and onboard battery',
      'Street LED luminaires',
      'Clock / photocell control',
      'Night autonomy with no grid connection',
    ],
    stats: [{ value: 'LED', label: 'Street' }, { value: '0 kWh', label: 'Grid' }],
    icon: 'lamp',
    anchor: [-14.7, 216.5, 4.2],
    cam: [20, 170, 16],
    target: [-15, 216, 3],
  },
  {
    id: 'tel-tower',
    brand: 'telecom',
    title: 'Site and tower',
    kicker: 'Mobile · 41 m',
    summary:
      '41 m self-supporting lattice tower: wind calculations, concrete foundations, assembly and audits. 437 elements. Sector antennas, microwave links and ICAO lighting.',
    points: [
      '41 m self-supporting tower, 437 elements',
      'Concrete foundations and soil studies',
      'Tri-band antennas and microwave links',
      'ICAO LED lighting + NOC telemetry',
    ],
    stats: [
      { value: '41 m', label: 'Height' },
      { value: '437', label: 'Elements' },
      { value: '6', label: 'Typical antennas' },
    ],
    icon: 'tower',
    anchor: [-89.8, 121.9, 26],
    cam: [-40, 70, 28],
    target: [-90, 122, 18],
  },
  {
    id: 'tel-cabinets',
    brand: 'telecom',
    title: 'Outdoor cabinets',
    kicker: 'Site power · 48 V',
    summary:
      'Cabinets and shelters: 48 V rack, rectifiers, lithium or VRLA, 48 V DC cooling. 14 cabinets. Hybrid solar backup generator.',
    points: [
      '48 V rectifiers and distribution',
      'Lithium / VRLA batteries',
      '48 V DC cabinet cooling',
      'Solar hybrid + generator, fuel telemetry',
    ],
    stats: [
      { value: '48 V', label: 'DC bus' },
      { value: '14', label: 'Cabinets' },
    ],
    icon: 'cabinet',
    anchor: [-72.4, 127.0, 2.8],
    cam: [-50, 100, 12],
    target: [-72, 127, 2],
  },
  {
    id: 'tel-fiber-air',
    brand: 'telecom',
    title: 'Aerial fibre',
    kicker: 'Fibre · 220 m ADSS',
    summary:
      'ADSS cable over 220 m of street, taps on shared LV/telecom poles, clamps, fittings and maintenance loops.',
    points: [
      'Self-supporting dielectric ADSS cable',
      'Shared LV / telecom poles',
      'Taps and slack loops',
      'Splicing, tests and OTDR certification',
    ],
    stats: [
      { value: '220 m', label: 'Street span' },
      { value: '34', label: 'Elements' },
    ],
    icon: 'fiber',
    anchor: [20.6, 209.1, 5.4],
    cam: [55, 160, 18],
    target: [21, 209, 5],
  },
  {
    id: 'tel-fiber-ug',
    brand: 'telecom',
    title: 'Underground fibre',
    kicker: 'OSP · chambers and closures',
    summary:
      'Concrete chambers, cast-iron frames, dome closures (FIST / FOSC), orange HDPE ducts in a shared trench. Typical MV trench 3×1×150 mm² XLPE.',
    points: [
      'Chambers, cast-iron covers and dome closures',
      'Incoming cables and organised loops',
      'HDPE ducts / microducts',
      'Sand bed, red mesh, manholes',
    ],
    stats: [
      { value: '23', label: 'Fibre objects' },
      { value: '150 mm²', label: 'Typical MV cable' },
    ],
    icon: 'fiber',
    anchor: [56.7, 315.9, 0.8],
    cam: [90, 280, 16],
    target: [57, 316, 0.6],
  },
  {
    id: 'tel-sro',
    brand: 'telecom',
    title: 'SRO',
    kicker: 'Optical distribution',
    summary:
      'Street cabinet: sealed enclosure, doors, labelling, plinth, grilles and feeder entries. Patching, couplers, port traceability.',
    points: [
      'FTTx patching and couplers',
      'Port labelling and traceability',
      'Feeder duct interface',
      '7 modelled cabinet elements',
    ],
    stats: [{ value: 'SRO', label: 'Street' }, { value: '7', label: 'Elements' }],
    icon: 'node',
    anchor: [55.1, 300.5, 1.6],
    cam: [80, 275, 12],
    target: [55, 301, 1.2],
  },
  {
    id: 'data-shell',
    brand: 'telecom',
    title: 'Data center',
    kicker: 'Building · 10 DCF packages',
    summary:
      'Envelope and technical room: foundations, heavy slab, penetrations, waterproofing. Packages DCF-00 to DCF-09: containment, cooling, fire, power, raised floor.',
    points: [
      'Turnkey engineering through to acceptance',
      'Rack layout and cold-aisle containment',
      'Precision cooling, free-cooling, in-row',
      'Continuity: transformer, generator, UPS, LV board',
    ],
    stats: [
      { value: '10 packages', label: 'DCF-00 → 09' },
      { value: 'Tier III', label: 'Target' },
      { value: 'PUE 1.32', label: 'NOC' },
    ],
    icon: 'datacenter',
    anchor: [-155, 198, 6],
    cam: [-90, 155, 18],
    target: [-160, 200, 6],
  },
  {
    id: 'data-genset',
    brand: 'energies',
    title: 'Generator sets',
    kicker: 'Backup · 10–4,000 kVA',
    summary:
      'Generator groups at the data center yard. They start automatically when the grid drops and couple through the ATS onto the low-voltage board.',
    points: [
      'Sets installed beside the technical hall',
      'Automatic start on grid loss',
      'ATS coupling to the LV board',
      'Range from 10 to 4,000 kVA',
    ],
    stats: [
      { value: '10–4,000 kVA', label: 'Range' },
      { value: 'AMF', label: 'Start' },
    ],
    icon: 'bolt',
    anchor: [-201.6, 188, 3.1],
    cam: [-230, 168, 10],
    target: [-201.6, 188, 2.5],
  },
  {
    id: 'data-power',
    brand: 'energies',
    title: 'Critical power',
    kicker: 'Supply · 10–4,000 kVA',
    summary:
      'Backup generator (AMF start, ATS), double-conversion N+1 UPS, OKKEN-type LV board, normal / UPS feeders. NETIS sets from 10 to 4,000 kVA.',
    points: [
      'Automatic start on grid loss',
      'ATS / LV board coupling',
      'N+1 UPS and battery autonomy',
      'Selective protection and 2N feeders',
    ],
    stats: [
      { value: '10–4,000 kVA', label: 'Generators' },
      { value: 'N+1', label: 'UPS' },
      { value: '482 kW', label: 'Typical IT load' },
    ],
    icon: 'bolt',
    anchor: [-136.9, 200.3, 3],
    cam: [-95, 165, 16],
    target: [-137, 200, 3],
  },
  {
    id: 'data-it',
    brand: 'telecom',
    title: 'Infrastructure IT',
    kicker: 'Room · 64 typical racks',
    summary:
      'High-density racks, SAN/NAS, virtualisation, spine/leaf fabric, Cat.6A copper and pre-terminated MTP fibre. BCP Berrechid reference: 170+ racks, 340+ PDUs.',
    points: [
      'Rack servers and hyperconvergence',
      'SAN/NAS storage and replication',
      'Spine/leaf, SDN and SD-WAN',
      'MTP + Cat.6A cabling',
    ],
    stats: [
      { value: '64', label: 'Typical 42U racks' },
      { value: '20,000+', label: 'Network ports' },
    ],
    icon: 'server',
    anchor: [-165, 203.2, 2.3],
    cam: [-110, 170, 14],
    target: [-165, 203, 2.3],
  },
  {
    id: 'data-noc',
    brand: 'managed',
    title: 'NOC room',
    kicker: 'Supervision · 13 screens',
    summary:
      '24/7 operations centre: alarms, power, sites and interventions. 13-screen wall (2×2 master + 12 consoles). 19 countries, 15,000 sites, 7,000 km of fibre.',
    points: [
      '19-country hypervision · 99.98% SLA',
      'Dispatch of 12 teams on 4×4, MTTR 18 min',
      'Solar SCADA, 48 V BESS, hybrid −40% diesel',
      'Cyber SOC, 2×2 CCTV, CMMS',
    ],
    stats: [
      { value: '13', label: 'Screens' },
      { value: '19', label: 'Countries' },
      { value: '15,000', label: 'Sites' },
      { value: '7,000 km', label: 'Fibre' },
    ],
    nocRoom: true,
    icon: 'noc',
    anchor: [-169.6, 129.4, 18],
    cam: [-120, 80, 32],
    target: [-170, 135, 16],
  },
  {
    id: 'tel-guard',
    brand: 'managed',
    title: 'Site security',
    kicker: 'Perimeter · 175 × 100 m',
    summary:
      '175 × 100 m fence (72 elements), motorised gate, 10 camera masts at 7.4 m, 360° CCTV to the NOC, guard post and access control.',
    points: [
      'Anti-climb fence and concertina wire',
      '10 masts, optical height 7.4 m',
      'Day/night IR cameras, 24/7 NOC feed',
      'Access control and logging',
    ],
    stats: [
      { value: '175 × 100 m', label: 'Fence' },
      { value: '10', label: 'CCTV masts' },
      { value: '7.4 m', label: 'Optical height' },
    ],
    icon: 'shield',
    anchor: [-90, 131, 4],
    cam: [-50, 95, 16],
    target: [-90, 132, 3],
  },
  {
    id: 'data-security',
    brand: 'managed',
    title: 'Security',
    kicker: 'Protection · VESDA / Novec',
    summary:
      'Room CCTV, biometrics, anti-passback, VESDA, Novec 1230 / water-mist suppression, 180+ reference cameras (Nador + Al Hoceima).',
    points: [
      'Multi-level biometric access control',
      'Cold / hot aisle CCTV',
      'Aspirating detection and Novec 1230',
      'NOC / BMS alarm integration',
    ],
    stats: [
      { value: '180+', label: 'Reference cameras' },
      { value: '4 zones', label: 'Novec' },
    ],
    icon: 'shield',
    anchor: [-160, 186, 3],
    cam: [-120, 155, 12],
    target: [-160, 186, 2.5],
  },
]

const TOUR_ORDER: Record<BrandId, string[]> = {
  energies: [
    'solar-field',
    'solar-roof',
    'solar-inverter',
    'solar-tech',
    'solar-delivery',
    'solar-bess',
    'data-genset',
    'data-power',
    'solar-source',
    'solar-carport',
    'solar-meteo',
    'solar-light',
  ],
  telecom: [
    'tel-tower',
    'tel-cabinets',
    'tel-fiber-air',
    'tel-fiber-ug',
    'tel-sro',
    'data-shell',
    'data-it',
  ],
  managed: ['data-noc', 'tel-guard', 'data-security'],
}

export function activitiesOf(brand: BrandId) {
  const byId = new Map(ACTIVITIES.filter((item) => item.brand === brand).map((item) => [item.id, item]))
  return TOUR_ORDER[brand].flatMap((id) => {
    const item = byId.get(id)
    return item ? [item] : []
  })
}

export function brandById(id: BrandId) {
  return BRANDS.find((brand) => brand.id === id)!
}

export function placeById(activity: Activity, placeId: string | null | undefined) {
  if (!placeId) return undefined
  return activity.places?.find((place) => place.id === placeId)
}

applyActivityDetails(ACTIVITIES)
