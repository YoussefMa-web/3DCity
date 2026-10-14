/** Data-center rooms already named in the current campus model. Missing names are skipped at runtime. */
export interface InteriorStepDef {
  id: string
  title: string
  summary: string
  points: string[]
  match?: RegExp
}

export const DC_INTERIOR_STEPS: InteriorStepDef[] = [
  {
    id: 'overview',
    title: 'Technical room',
    summary:
      'Interior of the data center already in the model: containment, power, cooling, detection and cabling. The roof is open for the visit.',
    points: [
      'DCF packages kept from the current model',
      'Roof cut locally, no other building',
      'A step appears only when its equipment is loaded',
    ],
  },
  {
    id: 'racks',
    title: 'Racks and containment',
    summary:
      'Rack layout and cold-aisle containment. Cold air is ducted to the servers to hold the target PUE.',
    points: ['Rack rows and containment', 'Separate cold and hot air', 'PDUs and connectivity between rows'],
    match: /confinement_d_allee|serveurs_stockage/i,
  },
  {
    id: 'cooling',
    title: 'Precision cooling',
    summary:
      'Cooling dedicated to IT: precision units, temperature and humidity control, N+1 redundancy.',
    points: ['Precision cooling and free-cooling', 'Temperature and humidity control', 'N+1 cooling backup'],
    match: /climatisation_de_precision/i,
  },
  {
    id: 'fire',
    title: 'Detection and suppression',
    summary:
      'Early detection and clean suppression: VESDA, Novec 1230 or water mist, tied into supervision.',
    points: ['Aspirating detection', 'Suppression without conductive residue', 'Alarms reported to the NOC'],
    match: /detection_extinction/i,
  },
  {
    id: 'ups',
    title: 'UPS',
    summary:
      'Double-conversion UPS in N+1. They carry the IT load until the generator picks up the grid.',
    points: ['Double conversion', 'Battery autonomy', 'N+1 redundancy'],
    match: /onduleur_ups/i,
  },
  {
    id: 'tgbt',
    title: 'LV switchboard',
    summary:
      'Main low-voltage board: normal and UPS incomers, selective feeders to the rooms and the cooling.',
    points: ['Normal and backed-up paths', 'Feeder selectivity', 'Generator / ATS coupling'],
    match: /distribution_electrique_tgbt/i,
  },
  {
    id: 'floor',
    title: 'Raised floor',
    summary:
      'Technical plenum under the racks: power routes, supply air and maintenance access.',
    points: ['Technical tiles', 'Cable tray', 'Cold-aisle supply air'],
    match: /faux_plancher/i,
  },
  {
    id: 'network',
    title: 'Room network',
    summary:
      'Data-center network core: copper, pre-terminated fibre and distribution to the racks.',
    points: ['Structured fibre and copper', 'Distribution to the racks', 'Separate power and data routes'],
    match: /reseau_datacenter/i,
  },
  {
    id: 'supervision',
    title: 'Room supervision',
    summary:
      'Room BMS / DCIM desk: power, cooling, fire and access control on the same screens.',
    points: ['Power and cooling alarms', 'DCIM hypervision', 'Escalation to the NOC'],
    match: /noc_gtc_supervision/i,
  },
  {
    id: 'cctv',
    title: 'Video surveillance',
    summary: 'Aisle and airlock cameras, day and night, logged with access control.',
    points: ['Cold and hot aisles', 'Airlocks and technical doors', 'Feed to the security desk'],
    match: /video_surveillance/i,
  },
  {
    id: 'fitout',
    title: 'Fit-out',
    summary: 'Room finishes: partitions, door frames and technical circulation.',
    points: ['Partitions and frames', 'Circulation', 'White-space finishes'],
    match: /amenagement_interieur|frames_inside|lestniza/i,
  },
]
