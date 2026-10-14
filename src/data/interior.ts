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
    title: 'Data center — schematic',
    summary:
      'One room, named as built: DCF-00 shell, DCF-01 to DCF-09 technical packages, IT-01, RES-01, RES-02 and SEC-01. A step appears only when that package is in the model.',
    points: [
      'DCF-00 shell and technical hall',
      'DCF-01 containment through DCF-09 fit-out',
      'IT-01, RES-01, RES-02, SEC-01',
    ],
  },
  {
    id: 'dcf-01',
    title: 'DCF-01 — Cold-aisle containment',
    summary: 'Urbanisation of the hall: cold-aisle containment so supply air reaches the rack fronts.',
    points: ['Cold aisle enclosed', 'Hot aisle left open', 'Aligned with the rack rows'],
    match: /dcf-01|confinement_d_allee/i,
  },
  {
    id: 'it-01',
    title: 'IT-01 — Servers and storage',
    summary: 'IT load in the contained aisles: servers, storage and virtualisation.',
    points: ['Rack rows', 'Storage and virtualisation', 'PDUs between rows'],
    match: /it-01|serveurs_stockage/i,
  },
  {
    id: 'dcf-02',
    title: 'DCF-02 — Precision cooling',
    summary: 'Cooling dedicated to IT: precision units, temperature and humidity, N+1.',
    points: ['Precision cooling', 'Temperature and humidity', 'N+1 backup'],
    match: /dcf-02|climatisation_de_precision/i,
  },
  {
    id: 'chillers',
    title: 'Rooftop chillers',
    summary: 'Heat rejection on the data center roof, above the technical hall.',
    points: ['Roof plant', 'Paired with DCF-02', 'Outside the white space'],
    match: /rooftop_chiller/i,
  },
  {
    id: 'dcf-03',
    title: 'DCF-03 — Fire detection and suppression',
    summary: 'Early detection and clean suppression, reported to supervision.',
    points: ['Aspirating detection', 'Suppression without conductive residue', 'Alarms to the NOC'],
    match: /dcf-03|detection_extinction/i,
  },
  {
    id: 'dcf-05',
    title: 'DCF-05 — UPS',
    summary: 'Double-conversion UPS in N+1. They carry the IT load until the generator picks up.',
    points: ['Double conversion', 'Battery autonomy', 'N+1 redundancy'],
    match: /dcf-05|onduleur_ups/i,
  },
  {
    id: 'dcf-07',
    title: 'DCF-07 — LV switchboard',
    summary: 'Main low-voltage board: normal and UPS incomers, selective feeders to the rooms and the cooling.',
    points: ['Normal and backed-up paths', 'Feeder selectivity', 'Generator / ATS coupling'],
    match: /dcf-07|distribution_electrique_tgbt/i,
  },
  {
    id: 'dcf-08',
    title: 'DCF-08 — Raised floor',
    summary: 'Technical plenum under the racks: power routes, supply air and maintenance access.',
    points: ['Technical tiles', 'Cable tray', 'Cold-aisle supply air'],
    match: /dcf-08|faux_plancher/i,
  },
  {
    id: 'res-01',
    title: 'RES-01 — Data center network',
    summary: 'Room network core: copper, pre-terminated fibre and distribution to the racks.',
    points: ['Structured fibre and copper', 'Distribution to the racks', 'Separate power and data routes'],
    match: /res-01|reseau_datacenter/i,
  },
  {
    id: 'res-02',
    title: 'RES-02 — NOC / DCIM',
    summary: 'Room supervision: power, cooling, fire and access on the same screens.',
    points: ['Power and cooling alarms', 'DCIM hypervision', 'Escalation to the NOC'],
    match: /res-02|noc_gtc_supervision/i,
  },
  {
    id: 'sec-01',
    title: 'SEC-01 — Video and access',
    summary: 'Aisle and airlock cameras, day and night, logged with access control.',
    points: ['Cold and hot aisles', 'Airlocks and technical doors', 'Feed to the security desk'],
    match: /sec-01|video_surveillance/i,
  },
  {
    id: 'dcf-09',
    title: 'DCF-09 — Interior fit-out',
    summary: 'Second work: partitions, door frames and technical circulation.',
    points: ['Partitions and frames', 'Circulation', 'White-space finishes'],
    match: /dcf-09|amenagement_interieur|frames_inside|lestniza/i,
  },
]
