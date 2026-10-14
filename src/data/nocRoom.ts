export type NocMetric = {
  label: string
  value: string
  unit?: string
  status?: 'ok' | 'warn' | 'alarm'
  change?: string
}

export type NocEquipmentItem = {
  name: string
  count: string
  status: string
}

export type NocMonitorSite = {
  id: string
  title: string
  subtitle: string
  category: string
  status: 'ok' | 'warn' | 'alarm'
  statusLabel: string
  sla: string
  supervisedAssets: string
  description: string
  metrics: NocMetric[]
  equipment: NocEquipmentItem[]
  procedures: string[]
}

export const NOC_OVERVIEW = {
  kicker: '24/7 hypervision and control room',
  title: 'NOC room · 13 screens',
  description:
    '24/7 control room unifying supervision of 19 African countries. 13-screen video wall (2×2 master screen + 12 consoles).',
  points: [
    'Unified supervision of 19 African countries',
    '15,000 telecom sites, 7,000 km of fibre and 4,000 solar plants',
    '2×2 master screen: mapping, DWDM and 4×4 teams',
    'Solar hybrid + BESS: −40% diesel avoided',
    'Global SLA 99.98% · on-call MTTR 18 min',
  ],
  stats: [
    { value: '13', label: 'Screens' },
    { value: '19', label: 'Countries' },
    { value: '15,000', label: 'Sites' },
    { value: '7,000 km', label: 'Fibre' },
  ],
}

export const NOC_MONITOR_SITES: NocMonitorSite[] = [
  {
    id: 'noc-africa-master',
    title: 'AFRICA HYPERVISION · 19 COUNTRIES',
    subtitle: '19 countries · 15,000 sites · 7,000 km fibre · 4,000 plants',
    category: 'MASTER SUPERVISION HUB',
    status: 'ok',
    statusLabel: '● 19 COUNTRIES CONNECTED',
    sla: 'Global network availability 99.98% · contracted SLA 99.95%',
    supervisedAssets:
      '15,000 telecom sites · 7,000 km of fibre · 4,000 solar plants · 3,000 people',
    description:
      'Master screen unifying live supervision of the 19 African countries operated by NETIS: Morocco, Ghana, Burkina Faso, Cote d\'Ivoire, Uganda, Kenya, Tanzania, Rwanda, Togo, Gabon, Benin, Cameroon, DRC, Ethiopia, Niger, Nigeria, Guinea, Madagascar and Zambia.',
    metrics: [
      { label: 'Managed telecom sites', value: '15,000', unit: 'Sites', status: 'ok', change: '19 countries live' },
      { label: 'Global availability', value: '99.98', unit: '%', status: 'ok', change: 'SLA met' },
      { label: 'Fibre deployed', value: '7,000', unit: 'km', status: 'ok', change: '100% operational' },
      { label: 'PV solar plants', value: '4,000', unit: 'Stations', status: 'ok', change: 'Green transition' },
      { label: 'People connected', value: '1,000,000+', unit: 'Users', status: 'ok', change: 'Direct impact' },
      { label: 'Mean response time', value: '18', unit: 'min', status: 'ok', change: 'On-call MTTR' },
    ],
    equipment: [
      { name: 'Regional telecom gateways', count: '19 countries', status: '100% operational' },
      { name: 'DWDM 100G/400G routing nodes', count: '38 PoP nodes', status: '1+1 redundancy' },
      { name: 'SCADA and RMS controllers', count: '8 HA clusters', status: 'Synchronised' },
      { name: 'Regional NOC control centres', count: '5 NOCs', status: 'Interconnected 24/7' },
    ],
    procedures: [
      '24/7/365 watch with 3×8 shift rotation',
      'Automated multi-country alarm correlation',
      'Satellite failover if fibre or a submarine cable is cut',
      'Daily SLA report per partner operator',
    ],
  },
  {
    id: 'noc-alarms',
    title: 'LIVE ALARMS AND INCIDENTS',
    subtitle: 'Smart filtering · severity P1/P2/P3',
    category: 'MANAGED SERVICES',
    status: 'ok',
    statusLabel: '0 CRITICAL · 2 MINOR',
    sla: 'P1 response < 5 min · P2 < 15 min · MTTR < 45 min',
    supervisedAssets: 'Alarm correlation engine · 15,000 monitored assets',
    description:
      'Live alarm matrix. Operating mix: 85% green, 10% amber, 5% red with immediate response.',
    metrics: [
      { label: 'Critical alarms (P1)', value: '0', unit: 'Active', status: 'ok' },
      { label: 'Minor alarms (P2/P3)', value: '2', unit: 'Open', status: 'warn' },
      { label: 'Network health', value: '99.4', unit: '%', status: 'ok' },
      { label: 'Mean close time', value: '24', unit: 'min', status: 'ok' },
    ],
    equipment: [
      { name: 'SNMP correlation servers', count: '4 HA servers', status: 'Operational' },
      { name: 'SMS / radio gateways', count: '12 relays', status: 'Active' },
    ],
    procedures: [
      'Mandatory acknowledgement within 3 minutes',
      'Automatic CMMS ticket with geolocation',
    ],
  },
  {
    id: 'noc-kpi',
    title: 'GROUP KPIs AND SLA COMMITMENTS',
    subtitle: 'Availability 99.98% · certified QoS',
    category: 'MANAGED SERVICES',
    status: 'ok',
    statusLabel: 'SLA MET',
    sla: 'Contracted global availability ≥ 99.95%',
    supervisedAssets: 'NETIS group telecom and energy infrastructure (19 countries)',
    description:
      'Group performance and quality-of-service indicators, tracked live against operator commitments.',
    metrics: [
      { label: 'Network availability', value: '99.98', unit: '%', status: 'ok' },
      { label: 'Managed telecom sites', value: '15,000', unit: 'Sites', status: 'ok' },
      { label: 'Group staff', value: '3,000', unit: 'Experts', status: 'ok' },
      { label: 'People connected', value: '1M+', unit: 'Users', status: 'ok' },
    ],
    equipment: [{ name: 'BI metric aggregation', count: 'Cloud cluster', status: 'Real time' }],
    procedures: ['Automatic availability audits for institutional clients'],
  },
  {
    id: 'noc-dispatch',
    title: 'FIELD DISPATCH AND CMMS',
    subtitle: '12 GPS-tracked 4×4 response crews',
    category: 'MANAGED SERVICES',
    status: 'ok',
    statusLabel: '12 MOBILE CREWS',
    sla: 'On-call departure < 15 min · resolution < 2 h',
    supervisedAssets: '4×4 mobile workshop fleet · I-V diagnostics · spare stock',
    description:
      'Technician coordination: 4×4 geolocation, work orders and preventive maintenance rounds.',
    metrics: [
      { label: 'Crews on patrol', value: '8 / 12', unit: 'Available', status: 'ok' },
      { label: 'Jobs in progress', value: '3', unit: 'On site', status: 'ok' },
      { label: 'Tickets closed (day)', value: '14', unit: 'Closed', status: 'ok' },
      { label: 'Spare availability', value: '100', unit: '%', status: 'ok' },
    ],
    equipment: [
      { name: 'CMMS off-road vehicles', count: '12 fleets', status: '4G / sat' },
      { name: 'Diagnostic cases and OTDR', count: '12 kits', status: 'Calibrated' },
    ],
    procedures: ['Assign the nearest technician by GPS'],
  },
  {
    id: 'noc-fiber',
    title: 'OPTICAL FIBRE NETWORK AND DWDM',
    subtitle: '7,000 km of fibre built and operated',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: '7,000 KM LIVE',
    sla: 'Optical availability 99.995% · P95 latency < 20 ms',
    supervisedAssets: '7,000 km of cable (aerial and buried) · 38 regional PoPs',
    description:
      'Fibre backbone: optical attenuation, DWDM lasers and automatic failover onto protected rings.',
    metrics: [
      { label: 'Fibre deployed', value: '7,000', unit: 'km', status: 'ok' },
      { label: 'Data traffic', value: '248.5', unit: 'Gbps', status: 'ok' },
      { label: 'Backbone cuts', value: '0', unit: 'Lines', status: 'ok' },
      { label: 'Mean attenuation', value: '0.21', unit: 'dB/km', status: 'ok' },
    ],
    equipment: [
      { name: 'DWDM 100G/400G chassis', count: '48 chassis', status: 'Nominal' },
      { name: 'OTDR monitoring', count: '24 systems', status: 'Continuous' },
    ],
    procedures: ['Cut location to ± 5 m by reflectometry'],
  },
  {
    id: 'noc-datacenter',
    title: 'DATA CENTER, IT AND CYBER SOC',
    subtitle: 'PUE 1.32 · high-density Tier III · SOC 24/7',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: 'TIER III · PUE 1.32',
    sla: 'Server hall uptime 99.982% · zero data leak',
    supervisedAssets: 'High-density halls · racks · cybersecurity SOC',
    description:
      'Data center and cybersecurity watch: PUE 1.32, aisle containment, SOC 24/7.',
    metrics: [
      { label: 'PUE index', value: '1.32', unit: 'PUE', status: 'ok' },
      { label: 'IT load', value: '482', unit: 'kW', status: 'ok' },
      { label: 'Threats blocked', value: '1,420', unit: '/day', status: 'ok' },
      { label: 'In-row cooling', value: '21.5', unit: '°C', status: 'ok' },
    ],
    equipment: [
      { name: '42U IT racks', count: '64 racks', status: '2N power' },
      { name: 'Novec 1230 suppression', count: '4 zones', status: 'Armed' },
    ],
    procedures: ['Permanent thermal probes on every rack'],
  },
  {
    id: 'noc-infra',
    title: 'INFRASTRUCTURE AND ROLLOUT',
    subtitle: '4,000 sites built · 128 active worksites',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: '4,000 SITES DELIVERED',
    sla: 'Schedule ≥ 98% · QA/QC ISO 9001',
    supervisedAssets: '4,000 turnkey sites · 900+ power poles',
    description:
      'Civil works, tower erection and grid connection: turnkey rollout tracking.',
    metrics: [
      { label: 'Sites built', value: '4,000', unit: 'Sites', status: 'ok' },
      { label: 'Worksites in progress', value: '128', unit: 'Open', status: 'ok' },
      { label: 'Power poles', value: '900+', unit: 'Network', status: 'ok' },
      { label: 'QHSE compliance', value: '100', unit: '%', status: 'ok' },
    ],
    equipment: [{ name: 'Engineering and civil crews', count: '45 crews', status: 'Field' }],
    procedures: ['Drone quality check before acceptance'],
  },
  {
    id: 'noc-tower',
    title: 'TOWERS AND 5G RADIO LINKS',
    subtitle: 'Station GH-ACC-0412 · 45 m tower',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: 'RADIO 99.99%',
    sla: 'Radio links 99.99% · RTT < 8 ms',
    supervisedAssets: '45 m self-supporting lattice · 6 tri-band antennas · MW',
    description:
      'Physical and RF supervision: dish alignment, mast verticality, ICAO lighting.',
    metrics: [
      { label: 'Radio availability', value: '99.99', unit: '%', status: 'ok' },
      { label: 'Night beacon', value: '100% OK', unit: 'Active', status: 'ok' },
      { label: 'Site wind', value: '18.4', unit: 'km/h', status: 'ok' },
      { label: 'MW latency', value: '4.2', unit: 'ms', status: 'ok' },
    ],
    equipment: [
      { name: '45 m self-supporting tower', count: '1 structure', status: 'Inspected' },
      { name: 'ICAO LED beacons', count: '3 lights', status: 'Working' },
    ],
    procedures: ['Six-month drone inspection (guys, bolts)'],
  },
  {
    id: 'noc-scada-pv',
    title: 'SOLAR SCADA · PV PRODUCTION',
    subtitle: 'Station GH-ACC-0412 · 60.9 kW PV',
    category: 'ENERGIES',
    status: 'ok',
    statusLabel: 'OUTPUT 60.9 kW',
    sla: 'Inverter yield ≥ 97.5% · PR ≥ 84%',
    supervisedAssets: '65 kWc generator · 3 three-phase inverters · 4,000 group plants',
    description:
      'SCADA telemetry: 60.9 kW output, 98.2% inverter yield, cell temperature.',
    metrics: [
      { label: 'Active PV power', value: '60.9', unit: 'kW', status: 'ok' },
      { label: 'Inverter yield', value: '98.2', unit: '%', status: 'ok' },
      { label: 'Group plants', value: '4,000', unit: 'Stations', status: 'ok' },
      { label: 'Energy delivered today', value: '342', unit: 'kWh', status: 'ok' },
    ],
    equipment: [
      { name: '20 kW inverters', count: '3 units', status: 'Producing' },
      { name: 'Pyranometers', count: '2 units', status: 'Calibrated' },
    ],
    procedures: ['Scheduled cleaning if PR drops below 80%'],
  },
  {
    id: 'noc-bess',
    title: 'BESS STORAGE AND 48 V BATTERIES',
    subtitle: 'Shelter KE-NRB-1187 · LiFePO4',
    category: 'ENERGIES',
    status: 'ok',
    statusLabel: 'SOC 88% · CHARGING',
    sla: 'Autonomy ≥ 14 h · cell balance ΔV < 15 mV',
    supervisedAssets: '48 V 1,200 Ah lithium bank · BMS',
    description:
      'LiFePO4 storage: SOC 88%, 53.8 V bus, solar charge current, shelter cooling.',
    metrics: [
      { label: 'State of charge (SOC)', value: '88.0', unit: '%', status: 'ok' },
      { label: 'DC bus voltage', value: '53.8', unit: 'V', status: 'ok' },
      { label: 'Autonomy', value: '14.5', unit: 'h', status: 'ok' },
      { label: 'Pack temperature', value: '23.5', unit: '°C', status: 'ok' },
    ],
    equipment: [
      { name: '48 V LiFePO4 racks', count: '8 racks', status: 'Balanced' },
      { name: 'Central BMS', count: '1 chassis', status: 'Nominal' },
    ],
    procedures: ['Charge management for more than 6,000 cycles'],
  },
  {
    id: 'noc-hybrid-diesel',
    title: 'HYBRID GENSET AND DIESEL AVOIDED',
    subtitle: '−40% diesel on hybrid sites',
    category: 'ENERGIES · HERO STAT',
    status: 'ok',
    statusLabel: '−40% DIESEL AVOIDED',
    sla: 'Diesel saving ≥ 35% · zero telecom outage',
    supervisedAssets: 'Microgrid: solar + BESS + backup generator',
    description:
      'Solar and batteries first, cutting diesel use and emissions by 40%.',
    metrics: [
      { label: 'Fuel saving', value: '−40.0', unit: '% diesel', status: 'ok' },
      { label: 'Green mix', value: '94.2', unit: '%', status: 'ok' },
      { label: 'Fuel saved', value: '18,400', unit: 'L/month', status: 'ok' },
      { label: 'Generator', value: 'Standby', unit: 'Ready', status: 'ok' },
    ],
    equipment: [
      { name: '45 kVA generator', count: '1 unit', status: 'Standby' },
      { name: 'Hybrid ATS controller', count: '1 chassis', status: 'Active' },
    ],
    procedures: ['Start diesel only if SOC < 20% and it is night'],
  },
  {
    id: 'noc-rms-irradiance',
    title: 'RMS CONTROLLER AND IRRADIANCE ATLAS',
    subtitle: 'Multi-sensor telemetry and solar atlas (W/m²)',
    category: 'ENERGIES',
    status: 'ok',
    statusLabel: '1,040 W/m² · RMS OK',
    sla: '15 s polling · class 0.5 measurement',
    supervisedAssets: 'Multi-probe IoT RMS · Meteosat MSG',
    description:
      '48 V RMS, thermal and intrusion probes, and a 0–1,200 W/m² GHI atlas for next-day forecast.',
    metrics: [
      { label: 'Peak irradiance', value: '1,040', unit: 'W/m²', status: 'ok' },
      { label: 'RMS voltage', value: '48.4', unit: 'V DC', status: 'ok' },
      { label: 'Shelter temperature', value: '22.8', unit: '°C', status: 'ok' },
      { label: 'Smoke / gas', value: 'Normal', unit: '0 alarms', status: 'ok' },
    ],
    equipment: [
      { name: 'GSM/IP IoT RMS', count: '1 enclosure', status: 'Connected' },
      { name: 'Pyranometers', count: '12 units', status: '99.4% correlation' },
    ],
    procedures: ['Instant alert on thermal or voltage drift'],
  },
  {
    id: 'noc-cctv-mosaic',
    title: 'CCTV VIDEO SURVEILLANCE',
    subtitle: '2×2 HD mosaic · night vision and AI',
    category: 'PHYSICAL SECURITY',
    status: 'ok',
    statusLabel: 'REC · 25 FPS',
    sla: '24/7 remote watch · intrusion < 2 s',
    supervisedAssets: '4K PTZ domes · NVR · laser barrier',
    description:
      'Mosaic: PV field, BTS shelter, 45 m mast and access airlock. Timestamp and presence detection.',
    metrics: [
      { label: 'Active cameras', value: '4 / 4', unit: 'HD streams', status: 'ok' },
      { label: 'Perimeter', value: 'Secure', unit: 'Normal', status: 'ok' },
      { label: 'Night lighting', value: 'Auto LED', unit: 'Ready', status: 'ok' },
      { label: 'Recording', value: '30 days', unit: 'H.265', status: 'ok' },
    ],
    equipment: [
      { name: '4K IR PTZ cameras', count: '4 units', status: 'Recording' },
      { name: 'Encrypted NVR', count: '1 bay', status: 'Operational' },
    ],
    procedures: [
      'Virtual patrol every 15 minutes',
      'Camera lock when a shelter door opens',
    ],
  },
]
