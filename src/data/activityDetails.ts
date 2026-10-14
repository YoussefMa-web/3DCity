import type { Activity, ActivityPlace } from './activities'

type Vec3 = [number, number, number]
type Source = { anchor: Vec3; cam: Vec3; target: Vec3 }

function view(
  source: Source,
  along: number,
  side = 0,
  lift = 0,
  fov = 34,
): Pick<ActivityPlace, 'anchor' | 'cam' | 'target' | 'fov' | 'minDistance' | 'maxDistance'> {
  const dx = source.target[0] - source.cam[0]
  const dy = source.target[1] - source.cam[1]
  const len = Math.hypot(dx, dy) || 1
  return {
    anchor: source.anchor,
    cam: [
      +(source.cam[0] + dx * along + (-dy / len) * side).toFixed(2),
      +(source.cam[1] + dy * along + (dx / len) * side).toFixed(2),
      +(source.cam[2] + (source.target[2] - source.cam[2]) * along + lift).toFixed(2),
    ],
    target: source.target,
    fov,
    minDistance: 4,
    maxDistance: 180,
  }
}

function place(
  source: Source,
  id: string,
  title: string,
  summary: string,
  points: string[],
  along: number,
  side = 0,
  lift = 0,
  fov = 34,
  benefits?: string[],
  flowKind?: 'fiber' | 'power',
): ActivityPlace {
  return { id, title, summary, points, benefits, flowKind, ...view(source, along, side, lift, fov) }
}

type Extra = Partial<Pick<Activity, 'benefits' | 'flowKind' | 'enterInterior' | 'fov' | 'minDistance' | 'maxDistance' | 'places'>>

export function applyActivityDetails(activities: Activity[]) {
  const sourceOf = (id: string): Source => {
    const activity = activities.find((item) => item.id === id)
    if (!activity) throw new Error(`missing activity ${id}`)
    return { anchor: activity.anchor, cam: activity.cam, target: activity.target }
  }
  const extras: Record<string, Extra> = {
    'solar-field': {
      fov: 42,
      minDistance: 8,
      maxDistance: 220,
      benefits: ['Power generated on site', 'About 1,220 tCO₂ avoided per year', 'EPC contract with no split packages'],
      places: [
        place(sourceOf('solar-field'), 'modules', 'Photovoltaic modules', '3,168 modules of 315 Wc, 997.9 kWc, with a 25-year linear power warranty.', ['315 Wc per module', '25-year power warranty', 'Strings grouped into cabinets'], 0.42, -18, 4, 32),
        place(sourceOf('solar-field'), 'structures', 'Structures and rows', 'Fixed tables, anchors and row alignment. The geometry serves yield and maintenance.', ['Anti-corrosion fixed structures', 'Maintenance aisles', 'Site wind resistance'], 0.28, 22, 8, 38),
      ],
    },
    'solar-inverter': {
      fov: 36,
      minDistance: 4,
      maxDistance: 80,
      flowKind: 'power',
      benefits: ['Monitored DC/AC conversion', 'Fault isolated at string level'],
      places: [
        place(sourceOf('solar-inverter'), 'inverters', 'Inverters', 'Eleven industrial inverters convert the strings. Alarms and efficiency are reported to supervision.', ['11 inverters', 'Automatic alarms', 'DC to AC efficiency'], 0.45, -6, 1, 30, undefined, 'power'),
        place(sourceOf('solar-inverter'), 'strings', 'String cabinets', 'Forty-four cabinets: string boxes and Quadro AC, surge arresters and disconnects.', ['44 cabinets', 'AC/DC surge arresters', 'Feeder to the Quadro AC'], 0.5, 8, 0.5, 28, undefined, 'power'),
      ],
    },
    'solar-bess': {
      fov: 38,
      minDistance: 4,
      maxDistance: 90,
      benefits: ['Peak shaving and backup', 'Plant smoothing'],
      places: [
        place(sourceOf('solar-bess'), 'racks', 'Lithium racks', 'ISO container and eight 48 V LiFePO4 racks. The BMS watches every string.', ['8 racks at 48 V', 'BMS and bidirectional PCS', 'Typical autonomy 14.5 h'], 0.4, -5, 1),
        place(sourceOf('solar-bess'), 'thermal', 'Thermal and fire', 'Ventilation grilles, 48 V cooling and an aerosol compartment. Cell temperature stays in range.', ['378 ventilation grilles', '48 V DC cooling', 'Container fire protection'], 0.48, 6, 0.4, 30),
      ],
    },
    'solar-tech': {
      fov: 34,
      minDistance: 3,
      maxDistance: 70,
      benefits: ['One room to meter, protect and supervise'],
      places: [
        place(sourceOf('solar-tech'), 'tgbt', 'Solar LV board', 'Low-voltage distribution for the plant and the interface to the delivery substation.', ['AC LV board', 'Feeder protection', 'Grid decoupling'], 0.4, -4, 0.6, 30),
        place(sourceOf('solar-tech'), 'scada', 'SCADA and metering', 'RTU, MV/LV metering and cooling for the control electronics.', ['SCADA gateway', 'MV/LV metering', '4 control racks'], 0.46, 5, 0.4, 28),
      ],
    },
    'solar-roof': {
      fov: 42,
      minDistance: 8,
      maxDistance: 160,
      benefits: ['Roof production stays distinct from the delivery substation'],
      places: [
        place(sourceOf('solar-roof'), 'modules', 'Roof modules', 'The photovoltaic array covers the data center roof. It is not the 1,000 kVA delivery building.', ['Modules on the roof', 'Above the technical hall', 'Campus power chain'], 0.35, -16, 4, 36),
        place(sourceOf('solar-roof'), 'edge', 'Roof edge', 'The array stops at the hall perimeter. The delivery substation is the small building to the north, not these modules.', ['Hall perimeter', 'Delivery building is separate', 'Chillers share this roof'], 0.5, 18, 2, 34),
      ],
    },
    'solar-delivery': {
      fov: 36,
      minDistance: 4,
      maxDistance: 90,
      flowKind: 'power',
      benefits: ['One substation shared by the plant and the data center'],
      places: [
        place(sourceOf('solar-delivery'), 'transformer', '1,000 kVA transformer', 'LV to MV step-up. The substation connects the plant and the data center.', ['1,000 kVA', 'Dual feeder', '80 modelled elements'], 0.38, -6, 1, 32, undefined, 'power'),
        place(sourceOf('solar-delivery'), 'cells', 'Cubicles and metering', 'MV cubicles, decoupling metering and protection of the delivery point.', ['MV cubicles', 'Decoupling relay', 'Grid interface'], 0.46, 7, 0.5, 30, undefined, 'power'),
      ],
    },
    'solar-source': {
      fov: 46,
      minDistance: 12,
      maxDistance: 260,
      flowKind: 'power',
      benefits: ['HV/MV injection and distribution on one substation'],
      places: [
        place(sourceOf('solar-source'), 'gantry', 'Gantries', 'Galvanised steelwork, 131 × 71 m, 32 m high. HV/MV switchgear is carried by the gantries.', ['131 × 71 m', 'Height 32 m', '6,539 elements'], 0.22, -30, 6, 40, undefined, 'power'),
        place(sourceOf('solar-source'), 'transformers', 'Transformers', '60/22 kV transformation, bunds and heavy access for maintenance.', ['60/22 kV', 'Retention bunds', 'Convoy access'], 0.34, 24, 2, 36, undefined, 'power'),
        place(sourceOf('solar-source'), 'protection', 'Protection', 'Relays, cubicle signalling and telemetry sent to the NOC.', ['Selective protection', 'Signalling', 'Substation SCADA'], 0.4, 10, 4, 34, undefined, 'power'),
      ],
    },
    'solar-carport': {
      fov: 38,
      minDistance: 4,
      maxDistance: 80,
      benefits: ['The car park generates and charges'],
      places: [
        place(sourceOf('solar-carport'), 'canopy', 'Canopies', '98 modules on 156 steel parts. Parking shade becomes a generating surface.', ['98 modules', '156 steel parts', '20-year structures'], 0.36, -8, 2, 32),
        place(sourceOf('solar-carport'), 'ev', 'Vehicle charging', 'L2 and DC Fast chargers, dynamic management with the grid and storage.', ['L2 and DC Fast', 'Charge control', 'BESS coupling'], 0.48, 8, 1, 30),
      ],
    },
    'solar-meteo': {
      fov: 32,
      minDistance: 3,
      maxDistance: 40,
      benefits: ['Performance ratio is computed from a reference measurement'],
      places: [
        place(sourceOf('solar-meteo'), 'irradiance', 'Irradiance', 'Class A pyranometers and a reference PV cell. The site atlas reaches 1,200 W/m².', ['Class A', 'Reference cell', 'Typical GHI 1,040 W/m²'], 0.35, -3, 0.4, 28),
        place(sourceOf('solar-meteo'), 'weather', 'Site weather', 'Module and ambient temperature, anemometer and wind vane explain production gaps.', ['Module and air probes', 'Wind', 'Input to the PR calculation'], 0.42, 4, 0.2, 26),
      ],
    },
    'solar-light': {
      fov: 36,
      minDistance: 3,
      maxDistance: 60,
      benefits: ['Street lighting with no grid pull'],
      places: [
        place(sourceOf('solar-light'), 'day', 'Day — charging', 'The module charges the battery. The luminaire stays on standby.', ['PV charging', 'Battery full', 'Luminaire at 0%'], 0.3, -4, 1, 32),
        place(sourceOf('solar-light'), 'night', 'Night — full output', 'Astronomical clock or photocell: the column goes to 100% with no grid.', ['0 W solar', 'LED at 100%', 'Battery autonomy'], 0.4, 0, 2, 30),
        place(sourceOf('solar-light'), 'eco', 'Night — eco mode', 'Dimming around 30%, with presence detection when the luminaire supports it.', ['LED at 30%', 'Detection', 'Longer autonomy'], 0.46, 5, 1, 28),
      ],
    },
    'tel-tower': {
      fov: 40,
      minDistance: 8,
      maxDistance: 160,
      benefits: ['One site designed, built and supervised by the same partner'],
      places: [
        place(sourceOf('tel-tower'), 'mast', '41 m tower', 'Self-supporting lattice, concrete foundations and 437 elements. The wind study comes before erection.', ['41 m', '437 elements', 'Foundations and soil study'], 0.25, -12, 6, 36),
        place(sourceOf('tel-tower'), 'radio', 'Antennas and links', 'Sector antennas and microwave links. The frequency plan sits on the same structure.', ['Tri-band antennas', 'Microwave links', 'Feeder lines'], 0.4, 8, -2, 32),
        place(sourceOf('tel-tower'), 'obstruction', 'Obstruction lighting', 'ICAO LED beacons, with fault telemetry to the NOC.', ['ICAO lighting', 'Beacon monitoring', 'NOC alarm'], 0.15, 0, 18, 28),
      ],
    },
    'tel-cabinets': {
      fov: 34,
      minDistance: 3,
      maxDistance: 70,
      benefits: ['The radio site runs on a backed-up 48 V bus'],
      places: [
        place(sourceOf('tel-cabinets'), 'rectifiers', '48 V rectifiers', 'Fourteen outdoor cabinets: rectification, distribution and 48 V cooling.', ['48 V bus', '14 cabinets', 'Site distribution'], 0.4, -5, 0.6, 30),
        place(sourceOf('tel-cabinets'), 'batteries', 'Batteries', 'Lithium or VRLA depending on the site, tested in preventive maintenance.', ['Lithium or VRLA', 'Radio autonomy', 'Bank test'], 0.5, 5, 0.3, 28),
      ],
    },
    'tel-fiber-air': {
      fov: 40,
      minDistance: 6,
      maxDistance: 140,
      flowKind: 'fiber',
      benefits: ['The street carries the cable without heavy civil works'],
      places: [
        place(sourceOf('tel-fiber-air'), 'adss', 'ADSS cable', 'Aerial span of about 220 m, self-supporting dielectric cable.', ['220 m of street', '34 elements', 'Slack loops'], 0.3, -10, 3, 36, undefined, 'fiber'),
        place(sourceOf('tel-fiber-air'), 'poles', 'Shared poles', 'Anchors on LV and telecom poles, clamps and taps.', ['Shared poles', 'Fittings', 'OTDR acceptance'], 0.45, 12, 1, 32, undefined, 'fiber'),
      ],
    },
    'tel-fiber-ug': {
      fov: 36,
      minDistance: 4,
      maxDistance: 80,
      flowKind: 'fiber',
      benefits: ['The optical network stays accessible and identifiable'],
      places: [
        place(sourceOf('tel-fiber-ug'), 'chamber', 'Chambers and closures', 'Concrete chambers, cast-iron covers and splice closures. Slack loops stay organised.', ['23 fibre objects', 'Dome closure', 'Maintenance access'], 0.4, -4, 1, 30, undefined, 'fiber'),
        place(sourceOf('tel-fiber-ug'), 'ducts', 'Ducts', 'Orange HDPE in a shared trench, with warning mesh.', ['HDPE ducts', 'Shared trench', 'Marking'], 0.5, 6, 0.4, 32, undefined, 'fiber'),
      ],
    },
    'tel-sro': {
      fov: 32,
      minDistance: 3,
      maxDistance: 50,
      flowKind: 'fiber',
      benefits: ['Every street port is traceable'],
      places: [
        place(sourceOf('tel-sro'), 'patch', 'Patching', 'Sealed street cabinet: doors, plinth, labelling and feeder entries.', ['FTTx patching', 'Port labelling', '7 elements'], 0.42, -3, 0.4, 28, undefined, 'fiber'),
        place(sourceOf('tel-sro'), 'splitters', 'Couplers', 'Couplers and continuity into the distribution ducts.', ['Couplers', 'Feeder continuity', 'Optical acceptance'], 0.5, 4, 0.2, 26, undefined, 'fiber'),
      ],
    },
    'tel-guard': {
      fov: 38,
      minDistance: 5,
      maxDistance: 120,
      benefits: ['The perimeter and the video reach the same NOC'],
      places: [
        place(sourceOf('tel-guard'), 'fence', 'Fence', '175 × 100 m perimeter, 72 elements, motorised gate.', ['175 × 100 m', 'Anti-climb', 'Gate'], 0.28, -14, 2, 36),
        place(sourceOf('tel-guard'), 'cctv', 'Camera masts', 'Ten masts, optics at 7.4 m, day/night view to the NOC.', ['10 masts', '7.4 m', '24/7 feed'], 0.4, 8, 3, 32),
      ],
    },
    'data-shell': {
      fov: 40,
      minDistance: 6,
      maxDistance: 140,
      enterInterior: true,
      benefits: ['From civil works to acceptance, one technical package'],
      places: [
        place(sourceOf('data-shell'), 'shell', 'DCF-00 — Shell', 'Foundations, heavy slab, penetrations and waterproofing. The packages inside keep their schematic names.', ['DCF-00 shell', 'DCF-01 to DCF-09', 'Tier III target'], 0.22, -16, 4, 38),
        place(sourceOf('data-shell'), 'hall', 'Technical hall', 'Opens the modelled room. Each step is one package: containment, IT, cooling, fire, UPS, LV board, floor, network, DCIM, video, fit-out.', ['DCF-01 cold aisle', 'IT-01 / RES-01 / RES-02 / SEC-01', 'Only equipment that is loaded'], 0.4, 10, 6, 34),
      ],
    },
    'data-genset': {
      fov: 36,
      minDistance: 4,
      maxDistance: 80,
      flowKind: 'power',
      benefits: ['The data center keeps running when the grid drops'],
      places: [
        place(sourceOf('data-genset'), 'yard', 'Generator yard', 'The sets stand at the data center yard, outside the technical hall.', ['Yard installation', '10–4,000 kVA', 'Beside the hall'], 0.35, -8, 1, 32, undefined, 'power'),
        place(sourceOf('data-genset'), 'start', 'Automatic start', 'AMF starts the group on grid loss and the ATS couples it to the LV board.', ['AMF start', 'ATS coupling', 'LV board'], 0.5, 6, 0.6, 30, undefined, 'power'),
      ],
    },
    'data-power': {
      fov: 34,
      minDistance: 4,
      maxDistance: 80,
      enterInterior: true,
      flowKind: 'power',
      benefits: ['The IT load does not see a grid outage'],
      places: [
        place(sourceOf('data-power'), 'genset', 'Generator', 'Sets from 10 to 4,000 kVA, automatic start and ATS.', ['10–4,000 kVA', 'AMF start', 'ATS coupling'], 0.35, -6, 1, 32, undefined, 'power'),
        place(sourceOf('data-power'), 'continuity', 'UPS and LV board', 'Double conversion N+1 and the main board. The typical tracked load is 482 kW.', ['N+1 UPS', 'LV board', '482 kW typical IT'], 0.48, 6, 0.8, 30, undefined, 'power'),
      ],
    },
    'data-it': {
      fov: 34,
      minDistance: 4,
      maxDistance: 70,
      enterInterior: true,
      benefits: ['The typical room holds 64 racks; the client reference exceeds 170'],
      places: [
        place(sourceOf('data-it'), 'racks', 'Racks', 'Sixty-four 42U racks in the typical room. The BCP Berrechid reference exceeds 170 racks.', ['64 racks of 42U', 'Aisle containment', 'PDU per rack'], 0.4, -5, 1, 30),
        place(sourceOf('data-it'), 'fabric', 'Network', 'Spine/leaf, Cat.6A copper and MTP fibre. More than 20,000 ports on the reference scope.', ['Spine/leaf', 'MTP and Cat.6A', '20,000+ ports'], 0.5, 6, 0.6, 28),
      ],
    },
    'data-noc': {
      fov: 42,
      minDistance: 8,
      maxDistance: 160,
      enterInterior: true,
      benefits: ['19 countries, 15,000 sites and 7,000 km of fibre on the same wall'],
      places: [
        place(sourceOf('data-noc'), 'wall', '13-screen wall', 'Master screen and twelve consoles: alarms, power, fibre, sites and teams.', ['13 screens', '99.98% SLA', 'On-call MTTR 18 min'], 0.3, -8, 2, 36),
        place(sourceOf('data-noc'), 'dispatch', 'Dispatch', 'Twelve field teams, CMMS and multi-country alarm correlation.', ['4×4 teams', 'CMMS', 'Opened in the Supervision tab'], 0.42, 10, 1, 34),
      ],
    },
    'data-security': {
      fov: 36,
      minDistance: 4,
      maxDistance: 80,
      enterInterior: true,
      benefits: ['Intrusion and fire land on the same desk'],
      places: [
        place(sourceOf('data-security'), 'access', 'Access', 'Biometrics, anti-passback and the technical-door log.', ['Multi-level', 'Airlock', 'NOC log'], 0.38, -5, 1, 32),
        place(sourceOf('data-security'), 'safety', 'Fire and video', 'VESDA, Novec on 4 zones, and more than 180 cameras on the reference scope.', ['VESDA', '4 Novec zones', '180+ reference cameras'], 0.48, 6, 0.8, 30),
      ],
    },
  }

  for (const activity of activities) {
    const extra = extras[activity.id]
    if (!extra) continue
    activity.benefits = extra.benefits
    activity.flowKind = extra.flowKind
    activity.enterInterior = extra.enterInterior
    activity.fov = extra.fov
    activity.minDistance = extra.minDistance
    activity.maxDistance = extra.maxDistance
    activity.places = extra.places
  }
}
