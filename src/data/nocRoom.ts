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
  kicker: '24/7 hypervision & salle de commandement',
  title: 'Salle NOC · 13 écrans',
  description:
    'Salle de commandement 24/7 unifiant la supervision de 19 pays d’Afrique. Mur vidéo de 13 écrans (écran maître 2×2 + 12 consoles).',
  points: [
    'Supervision unifiée de 19 pays d’Afrique',
    '15 000 sites télécoms, 7 000 km de fibre et 4 000 centrales solaires',
    'Écran maître 2×2 : cartographie, DWDM et équipes 4×4',
    'Hybride solaire + BESS : −40 % de diesel évité',
    'SLA global 99,98 % · astreinte MTTR 18 min',
  ],
  stats: [
    { value: '13', label: 'Écrans' },
    { value: '19', label: 'Pays' },
    { value: '15 000', label: 'Sites' },
    { value: '7 000 km', label: 'Fibre' },
  ],
}

export const NOC_MONITOR_SITES: NocMonitorSite[] = [
  {
    id: 'noc-africa-master',
    title: 'HYPERVISION AFRIQUE · 19 PAYS',
    subtitle: '19 Pays · 15 000 Sites · 7 000 km Fibre · 4 000 Centrales',
    category: 'MASTER SUPERVISION HUB',
    status: 'ok',
    statusLabel: '● 19 PAYS CONNECTÉS',
    sla: 'Disponibilité globale réseau 99,98 % · SLA contractuel 99,95 %',
    supervisedAssets:
      '15 000 sites télécom · 7 000 km fibre optique · 4 000 centrales solaires · 3 000 collaborateurs',
    description:
      'Écran maître central unifiant la supervision en temps réel des 19 pays d’Afrique opérés par NETIS : Maroc, Ghana, Burkina Faso, Côte d’Ivoire, Ouganda, Kenya, Tanzanie, Rwanda, Togo, Gabon, Bénin, Cameroun, RDC, Éthiopie, Niger, Nigeria, Guinée, Madagascar et Zambie.',
    metrics: [
      { label: 'Sites télécom gérés', value: '15 000', unit: 'Sites', status: 'ok', change: '19 pays actifs' },
      { label: 'Disponibilité globale', value: '99,98', unit: '%', status: 'ok', change: 'SLA respecté' },
      { label: 'Fibre optique déployée', value: '7 000', unit: 'km', status: 'ok', change: '100 % opérationnel' },
      { label: 'Centrales solaires PV', value: '4 000', unit: 'Stations', status: 'ok', change: 'Transition verte' },
      { label: 'Personnes connectées', value: '1 000 000+', unit: 'Usagers', status: 'ok', change: 'Impact direct' },
      { label: 'Temps moyen réponse', value: '18', unit: 'min', status: 'ok', change: 'MTTR d’astreinte' },
    ],
    equipment: [
      { name: 'Passerelles télécom régionales', count: '19 pays', status: '100 % opérationnelles' },
      { name: 'Nœuds de routage DWDM 100G/400G', count: '38 nœuds PoP', status: 'Redondance 1+1' },
      { name: 'Contrôleurs SCADA & RMS', count: '8 clusters HA', status: 'Synchronisés' },
      { name: 'Centres de contrôle régionaux NOC', count: '5 NOCs', status: 'Interconnectés 24/7' },
    ],
    procedures: [
      'Surveillance 24/7/365 en rotation d’équipes 3×8',
      'Corrélation automatisée des alarmes multi-pays',
      'Bascule satellite en cas de rupture fibre ou câble sous-marin',
      'Reporting SLA quotidien par opérateur partenaire',
    ],
  },
  {
    id: 'noc-alarms',
    title: 'ALARMES & INCIDENTS TEMPS RÉEL',
    subtitle: 'Filtrage intelligent · sévérité P1/P2/P3',
    category: 'MANAGED SERVICES',
    status: 'ok',
    statusLabel: '0 CRITIQUE · 2 MINEURES',
    sla: 'Prise en charge P1 < 5 min · P2 < 15 min · MTTR < 45 min',
    supervisedAssets: 'Moteur de corrélation d’alarmes · 15 000 équipements monitorés',
    description:
      'Matrice des alarmes en temps réel. Ratio opérationnel : 85 % vert, 10 % ambre, 5 % rouge avec intervention immédiate.',
    metrics: [
      { label: 'Alarmes critiques (P1)', value: '0', unit: 'Actives', status: 'ok' },
      { label: 'Alarmes mineures (P2/P3)', value: '2', unit: 'En cours', status: 'warn' },
      { label: 'Santé réseau', value: '99,4', unit: '%', status: 'ok' },
      { label: 'Temps moyen clôture', value: '24', unit: 'min', status: 'ok' },
    ],
    equipment: [
      { name: 'Serveurs de corrélation SNMP', count: '4 serveurs HA', status: 'Opérationnels' },
      { name: 'Passerelles SMS / radio', count: '12 relais', status: 'Actifs' },
    ],
    procedures: [
      'Acquittement obligatoire sous 3 minutes',
      'Ticket GMAO automatique avec géolocalisation',
    ],
  },
  {
    id: 'noc-kpi',
    title: 'KPI GROUPE & ENGAGEMENTS SLA',
    subtitle: 'Disponibilité 99,98 % · QoS certifiée',
    category: 'MANAGED SERVICES',
    status: 'ok',
    statusLabel: 'SLA RESPECTÉ',
    sla: 'Disponibilité globale contractuelle ≥ 99,95 %',
    supervisedAssets: 'Infrastructures télécom & énergie groupe NETIS (19 pays)',
    description:
      'Indicateurs de performance et de qualité de service à l’échelle groupe, suivis en direct vis-à-vis des opérateurs.',
    metrics: [
      { label: 'Disponibilité réseau', value: '99,98', unit: '%', status: 'ok' },
      { label: 'Sites télécom gérés', value: '15 000', unit: 'Sites', status: 'ok' },
      { label: 'Collaborateurs groupe', value: '3 000', unit: 'Experts', status: 'ok' },
      { label: 'Personnes connectées', value: '1M+', unit: 'Usagers', status: 'ok' },
    ],
    equipment: [{ name: 'Agrégation de métriques BI', count: 'Cluster cloud', status: 'Temps réel' }],
    procedures: ['Audits de disponibilité automatiques pour les clients institutionnels'],
  },
  {
    id: 'noc-dispatch',
    title: 'DISPATCH TERRAIN & GMAO',
    subtitle: '12 équipes 4×4 d’intervention GPS',
    category: 'MANAGED SERVICES',
    status: 'ok',
    statusLabel: '12 ÉQUIPES MOBILES',
    sla: 'Départ astreinte < 15 min · résolution < 2 h',
    supervisedAssets: 'Flotte 4×4 atelier mobile · diagnostic I-V · stock pièces',
    description:
      'Coordination des techniciens : géolocalisation des 4×4, ordres de mission et tournées de maintenance préventive.',
    metrics: [
      { label: 'Équipes en patrouille', value: '8 / 12', unit: 'Disponibles', status: 'ok' },
      { label: 'Interventions en cours', value: '3', unit: 'Sur site', status: 'ok' },
      { label: 'Tickets résolus (jour)', value: '14', unit: 'Clôturés', status: 'ok' },
      { label: 'Disponibilité pièces', value: '100', unit: '%', status: 'ok' },
    ],
    equipment: [
      { name: 'Véhicules tout-terrain GMAO', count: '12 flottes', status: '4G / sat' },
      { name: 'Valises diagnostic & OTDR', count: '12 kits', status: 'Étalonnés' },
    ],
    procedures: ['Affectation du technicien le plus proche par GPS'],
  },
  {
    id: 'noc-fiber',
    title: 'RÉSEAU FIBRE OPTIQUE & DWDM',
    subtitle: '7 000 km de fibre déployés et exploités',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: '7 000 KM ACTIFS',
    sla: 'Disponibilité optique 99,995 % · latence P95 < 20 ms',
    supervisedAssets: '7 000 km câbles (aérien & enterré) · 38 PoPs régionaux',
    description:
      'Réseau dorsal fibre : atténuation optique, lasers DWDM et bascule automatique sur anneaux sécurisés.',
    metrics: [
      { label: 'Fibre déployée', value: '7 000', unit: 'km', status: 'ok' },
      { label: 'Trafic données', value: '248,5', unit: 'Gbps', status: 'ok' },
      { label: 'Coupures backbone', value: '0', unit: 'Lignes', status: 'ok' },
      { label: 'Atténuation moyenne', value: '0,21', unit: 'dB/km', status: 'ok' },
    ],
    equipment: [
      { name: 'Châssis DWDM 100G/400G', count: '48 châssis', status: 'Nominal' },
      { name: 'Surveillance OTDR', count: '24 systèmes', status: 'Continu' },
    ],
    procedures: ['Localisation de coupure à ± 5 m par réflectométrie'],
  },
  {
    id: 'noc-datacenter',
    title: 'DATA CENTER, IT & SOC CYBER',
    subtitle: 'PUE 1,32 · haute densité Tier III · SOC 24/7',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: 'TIER III · PUE 1,32',
    sla: 'Uptime salles serveurs 99,982 % · zéro fuite données',
    supervisedAssets: 'Salles haute densité · baies · SOC cybersécurité',
    description:
      'Surveillance des data centers et de la cybersécurité : PUE 1,32, confinement d’allée, SOC 24/7.',
    metrics: [
      { label: 'Indice PUE', value: '1,32', unit: 'PUE', status: 'ok' },
      { label: 'Charge IT', value: '482', unit: 'kW', status: 'ok' },
      { label: 'Menaces bloquées', value: '1 420', unit: '/jour', status: 'ok' },
      { label: 'Climatisation in-row', value: '21,5', unit: '°C', status: 'ok' },
    ],
    equipment: [
      { name: 'Baies IT 42U', count: '64 racks', status: 'Alim. 2N' },
      { name: 'Extinction Novec 1230', count: '4 zones', status: 'Armé' },
    ],
    procedures: ['Sondes thermiques permanentes par baie'],
  },
  {
    id: 'noc-infra',
    title: 'INFRASTRUCTURE & ROLLOUT',
    subtitle: '4 000 sites construits · 128 chantiers actifs',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: '4 000 SITES LIVRÉS',
    sla: 'Planning ≥ 98 % · QA/QC ISO 9001',
    supervisedAssets: '4 000 sites clé en main · 900+ poteaux électriques',
    description:
      'Chantiers GC, montage de pylônes et raccordement : suivi du déploiement clé en main.',
    metrics: [
      { label: 'Sites construits', value: '4 000', unit: 'Sites', status: 'ok' },
      { label: 'Chantiers en cours', value: '128', unit: 'En cours', status: 'ok' },
      { label: 'Poteaux électriques', value: '900+', unit: 'Réseau', status: 'ok' },
      { label: 'Conformité QHSE', value: '100', unit: '%', status: 'ok' },
    ],
    equipment: [{ name: 'Équipes ingénierie & GC', count: '45 équipes', status: 'Terrain' }],
    procedures: ['Contrôle qualité drone avant PV de recette'],
  },
  {
    id: 'noc-tower',
    title: 'PYLÔNES & FAISCEAUX RADIO 5G',
    subtitle: 'Station GH-ACC-0412 · pylône 45 m',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: 'RADIO 99,99 %',
    sla: 'Faisceaux 99,99 % · RTT < 8 ms',
    supervisedAssets: 'Pylône treillis autostable 45 m · 6 antennes tri-bande · MW',
    description:
      'Supervision physique et RF : alignement des paraboles, verticalité du mât, balisage OACI.',
    metrics: [
      { label: 'Disponibilité radio', value: '99,99', unit: '%', status: 'ok' },
      { label: 'Balisage nocturne', value: '100 % OK', unit: 'Actif', status: 'ok' },
      { label: 'Vent site', value: '18,4', unit: 'km/h', status: 'ok' },
      { label: 'Latence MW', value: '4,2', unit: 'ms', status: 'ok' },
    ],
    equipment: [
      { name: 'Pylône autostable 45 m', count: '1 structure', status: 'Inspectée' },
      { name: 'Balises LED OACI', count: '3 feux', status: 'Fonctionnels' },
    ],
    procedures: ['Inspection semestrielle drone (haubans, boulonnerie)'],
  },
  {
    id: 'noc-scada-pv',
    title: 'SCADA SOLAIRE · PRODUCTION PV',
    subtitle: 'Station GH-ACC-0412 · 60,9 kW PV',
    category: 'ENERGIES',
    status: 'ok',
    statusLabel: 'PROD 60,9 kW',
    sla: 'Rendement onduleurs ≥ 97,5 % · PR ≥ 84 %',
    supervisedAssets: 'Générateur 65 kWc · 3 onduleurs triphasés · 4 000 centrales groupe',
    description:
      'Télémétrie SCADA : puissance 60,9 kW, rendement onduleurs 98,2 %, température cellules.',
    metrics: [
      { label: 'Puissance PV active', value: '60,9', unit: 'kW', status: 'ok' },
      { label: 'Rendement onduleurs', value: '98,2', unit: '%', status: 'ok' },
      { label: 'Centrales groupe', value: '4 000', unit: 'Stations', status: 'ok' },
      { label: 'Énergie injectée jour', value: '342', unit: 'kWh', status: 'ok' },
    ],
    equipment: [
      { name: 'Onduleurs 20 kW', count: '3 unités', status: 'Production' },
      { name: 'Pyranomètres', count: '2 unités', status: 'Calibrés' },
    ],
    procedures: ['Nettoyage programmé si PR < 80 %'],
  },
  {
    id: 'noc-bess',
    title: 'STOCKAGE BESS & BATTERIES 48 V',
    subtitle: 'Shelter KE-NRB-1187 · LiFePO4',
    category: 'ENERGIES',
    status: 'ok',
    statusLabel: 'SOC 88 % · CHARGE',
    sla: 'Autonomie ≥ 14 h · équilibrage ΔV < 15 mV',
    supervisedAssets: 'Banc lithium 48 V 1 200 Ah · BMS',
    description:
      'Stockage LiFePO4 : SOC 88 %, bus 53,8 V, courant de charge solaire, clim shelter.',
    metrics: [
      { label: 'État de charge (SOC)', value: '88,0', unit: '%', status: 'ok' },
      { label: 'Tension DC bus', value: '53,8', unit: 'V', status: 'ok' },
      { label: 'Autonomie', value: '14,5', unit: 'h', status: 'ok' },
      { label: 'Température packs', value: '23,5', unit: '°C', status: 'ok' },
    ],
    equipment: [
      { name: 'Racks LiFePO4 48 V', count: '8 racks', status: 'Équilibrés' },
      { name: 'BMS centralisé', count: '1 châssis', status: 'Nominal' },
    ],
    procedures: ['Gestion de charge pour > 6 000 cycles'],
  },
  {
    id: 'noc-hybrid-diesel',
    title: 'HYBRIDE GENSET & DIESEL ÉVITÉ',
    subtitle: '−40 % de diesel sur sites hybridés',
    category: 'ENERGIES · HERO STAT',
    status: 'ok',
    statusLabel: '−40 % DIESEL ÉVITÉ',
    sla: 'Économie diesel ≥ 35 % · zéro coupure télécom',
    supervisedAssets: 'Micro-grid : solaire + BESS + groupe secours',
    description:
      'Priorité solaire et batteries pour réduire de 40 % le gasoil et les émissions.',
    metrics: [
      { label: 'Économie carburant', value: '−40,0', unit: '% diesel', status: 'ok' },
      { label: 'Mix vert', value: '94,2', unit: '%', status: 'ok' },
      { label: 'Carburant économisé', value: '18 400', unit: 'L/mois', status: 'ok' },
      { label: 'Groupe électrogène', value: 'Standby', unit: 'Prêt', status: 'ok' },
    ],
    equipment: [
      { name: 'Groupe 45 kVA', count: '1 unité', status: 'Veille' },
      { name: 'Contrôleur hybride ATS', count: '1 châssis', status: 'Actif' },
    ],
    procedures: ['Démarrage diesel seulement si SOC < 20 % + nuit'],
  },
  {
    id: 'noc-rms-irradiance',
    title: 'CONTRÔLEUR RMS & ATLAS IRRADIANCE',
    subtitle: 'Télémétrie multi-capteurs & atlas solaire (W/m²)',
    category: 'ENERGIES',
    status: 'ok',
    statusLabel: '1 040 W/m² · RMS OK',
    sla: 'Polling 15 s · mesure classe 0,5',
    supervisedAssets: 'RMS IoT multi-sondes · Météosat MSG',
    description:
      'RMS 48 V, sondes thermiques, intrusion, et atlas GHI 0–1 200 W/m² pour prévision J+1.',
    metrics: [
      { label: 'Irradiance max', value: '1 040', unit: 'W/m²', status: 'ok' },
      { label: 'Tension RMS', value: '48,4', unit: 'V DC', status: 'ok' },
      { label: 'Température shelter', value: '22,8', unit: '°C', status: 'ok' },
      { label: 'Fumée / gaz', value: 'Normal', unit: '0 alarme', status: 'ok' },
    ],
    equipment: [
      { name: 'RMS IoT GSM/IP', count: '1 boîtier', status: 'Connecté' },
      { name: 'Pyranomètres', count: '12 unités', status: 'Corrélation 99,4 %' },
    ],
    procedures: ['Alerte instantanée en dérive thermique ou tension'],
  },
  {
    id: 'noc-cctv-mosaic',
    title: 'VIDÉOSURVEILLANCE CCTV',
    subtitle: 'Mosaïque 2×2 HD · vision nocturne & IA',
    category: 'SÉCURITÉ PHYSIQUE',
    status: 'ok',
    statusLabel: 'REC · 25 FPS',
    sla: 'Télésurveillance 24/7 · intrusion < 2 s',
    supervisedAssets: 'Dômes PTZ 4K · NVR · barrière laser',
    description:
      'Mosaïque : parc PV, shelter BTS, mât 45 m et sas d’accès. Horodatage et détection de présence.',
    metrics: [
      { label: 'Caméras actives', value: '4 / 4', unit: 'Flux HD', status: 'ok' },
      { label: 'Périmètre', value: 'Sécurisé', unit: 'Normal', status: 'ok' },
      { label: 'Éclairage nocturne', value: 'Auto LED', unit: 'Prêt', status: 'ok' },
      { label: 'Enregistrement', value: '30 jours', unit: 'H.265', status: 'ok' },
    ],
    equipment: [
      { name: 'Caméras IP PTZ 4K IR', count: '4 unités', status: 'Enregistrement' },
      { name: 'NVR chiffré', count: '1 baie', status: 'Opérationnel' },
    ],
    procedures: [
      'Ronde virtuelle toutes les 15 minutes',
      'Asservissement caméra sur ouverture de porte shelter',
    ],
  },
]
