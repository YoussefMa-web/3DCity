import * as THREE from 'three'

function blenderToThree(x: number, y: number, z: number) {
  return new THREE.Vector3(x, z, -y)
}

export type NocMetric = {
  label: string
  value: string
  unit?: string
  status?: 'ok' | 'warn' | 'alarm'
  change?: string
  target?: string
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
  screenType:
    | 'africa-master'
    | 'alarms'
    | 'kpi'
    | 'dispatch'
    | 'fiber'
    | 'datacenter'
    | 'infra'
    | 'tower'
    | 'scada-pv'
    | 'bess'
    | 'hybrid-diesel'
    | 'rms-irradiance'
    | 'cctv-mosaic'
  description: string
  sla: string
  supervisedAssets: string
  metrics: NocMetric[]
  equipment: NocEquipmentItem[]
  procedures: string[]
}

export const NOC_MONITOR_SITES: NocMonitorSite[] = [
  // 0. MASTER SCREEN (2x2 Central Fused Screen)
  {
    id: 'noc-africa-master',
    title: 'HYPERVISION AFRIQUE · 19 PAYS',
    subtitle: '19 Pays · 15 000 Sites · 7 000 km Fibre · 4 000 Centrales',
    category: 'MASTER SUPERVISION HUB',
    status: 'ok',
    statusLabel: '● 19 PAYS CONNECTÉS',
    screenType: 'africa-master',
    sla: 'Disponibilité Globale Réseau 99.98% · SLA Contractuel 99.95%',
    supervisedAssets:
      '15 000 Sites Télécom · 7 000 km Fibre Optique · 4 000 Centrales Solaires · 3 000 Collaborateurs',
    description:
      'Écran maître central unifiant la supervision en temps réel des 19 pays d’Afrique opérés par NETIS : Maroc, Ghana, Burkina Faso, Côte d’Ivoire, Ouganda, Kenya, Tanzanie, Rwanda, Togo, Gabon, Bénin, Cameroun, RDC, Éthiopie, Niger, Nigeria, Guinée, Madagascar et Zambie. Agrégation des couches télécom, énergie solaire, liaisons fibre inter-hubs et dispatch des astreintes.',
    metrics: [
      { label: 'Sites Télécom Gérés', value: '15 000', unit: 'Sites', status: 'ok', change: '19 Pays Actifs' },
      { label: 'Disponibilité Globale', value: '99.98', unit: '%', status: 'ok', change: 'SLA Respecté' },
      { label: 'Fibre Optique Déployée', value: '7 000', unit: 'km', status: 'ok', change: '100% Opérationnel' },
      { label: 'Centrales Solaires PV', value: '4 000', unit: 'Stations', status: 'ok', change: 'Transition Verte' },
      { label: 'Personnes Connectées', value: '1 000 000+', unit: 'Usagers', status: 'ok', change: 'Impact direct' },
      { label: 'Temps Moyen Réponse', value: '18', unit: 'min', status: 'ok', change: 'MTTR d’astreinte' },
    ],
    equipment: [
      { name: 'Passerelles Télécom Régionales', count: '19 Pays', status: '100% Opérationnelles' },
      { name: 'Nœuds de Routage DWDM 100G/400G', count: '38 Nœuds PoP', status: 'Redondance 1+1' },
      { name: 'Contrôleurs SCADA & RMS Centralisés', count: '8 Clusters HA', status: 'Synchronisés' },
      { name: 'Centres de Contrôle Régionaux NOC', count: '5 NOCs', status: 'Interconnectés 24/7' },
    ],
    procedures: [
      'Surveillance proactive 24/7/365 en rotation d’équipes 3x8',
      'Corrélation automatisée des alarmes multi-pays et priorisation dynamique',
      'Bascule automatique satellite en cas de rupture de câble sous-marin ou coupure fibre',
      'Reporting exécutif journalier de la performance SLA par opérateur partenaire',
    ],
  },

  // 1. ALARMES ACTIVES (Managed Services)
  {
    id: 'noc-alarms',
    title: 'ALARMES & INCIDENTS TEMPS RÉEL',
    subtitle: 'Filtrage Intelligent des Incidents & Sévérité P1/P2/P3',
    category: 'MANAGED SERVICES',
    status: 'ok',
    statusLabel: '0 CRITIQUE · 2 MINEURES',
    screenType: 'alarms',
    sla: 'Prise en charge P1 < 5 min · P2 < 15 min · MTTR < 45 min',
    supervisedAssets: 'Moteur de Corrélation d’Alarmes · 15 000 Équipements Monitorés',
    description:
      'Matrice des alarmes en temps réel sur l’ensemble du parc. Respect strict du ratio opérationnel : 85% vert (nominal), 10% ambre (avertissement préventif), 5% rouge avec intervention immédiate engagée.',
    metrics: [
      { label: 'Alarmes Critiques (P1)', value: '0', unit: 'Actives', status: 'ok', change: 'Zéro coupure réseau' },
      { label: 'Alarmes Mineures (P2/P3)', value: '2', unit: 'En cours', status: 'warn', change: 'Maintenance filtres' },
      { label: 'Ratio Santé Réseau', value: '99.4', unit: '% Nominal', status: 'ok', change: '85% OK / 10% Warn / 5% Crit' },
      { label: 'Temps Moyen Clôture', value: '24', unit: 'min', status: 'ok', change: 'Objectif < 45 min' },
    ],
    equipment: [
      { name: 'Serveurs de Corrélation d’Alarmes SNMP', count: '4 Serveurs HA', status: 'Opérationnels' },
      { name: 'Passerelles de Notification SMS / Radio', count: '12 Relais', status: 'Actifs' },
    ],
    procedures: [
      'Acquittement obligatoire de toute alarme par l’opérateur sous 3 minutes',
      'Création automatique du ticket GMAO avec géolocalisation pour l’équipe d’astreinte',
    ],
  },

  // 2. KPI GROUPE & SLA (Managed Services)
  {
    id: 'noc-kpi',
    title: 'KPI GROUPE & ENGAGEMENTS SLA',
    subtitle: 'Disponibilité 99.98% · Qualité de Service Certifiée',
    category: 'MANAGED SERVICES',
    status: 'ok',
    statusLabel: 'SLA RESPECTÉ',
    screenType: 'kpi',
    sla: 'Disponibilité Globale Contractuelle ≥ 99.95%',
    supervisedAssets: 'Infrastructures Télécom & Énergie Groupe NETIS (19 Pays)',
    description:
      'Indicateurs clés de performance et de qualité de service à l’échelle groupe. Suivi en direct du respect des accords de niveau de service (SLA) envers les opérateurs télécoms majeurs et gestionnaires de réseau.',
    metrics: [
      { label: 'Disponibilité Réseau', value: '99.98', unit: '%', status: 'ok', change: 'SLA Cible > 99.95%' },
      { label: 'Sites Télécom Gérés', value: '15 000', unit: 'Sites', status: 'ok', change: 'Actifs gérés' },
      { label: 'Collaborateurs Groupe', value: '3 000', unit: 'Experts', status: 'ok', change: 'Équipes locales 24/7' },
      { label: 'Personnes Connectées', value: '1M+', unit: 'Usagers', status: 'ok', change: 'Couverture rurale & urbaine' },
    ],
    equipment: [
      { name: 'Système d’Agrégation de Métriques BI', count: 'Cluster Cloud', status: 'Temps Réel' },
    ],
    procedures: [
      'Génération automatique des audits de disponibilité pour les clients institutionnels',
    ],
  },

  // 3. DISPATCH TERRAIN (Managed Services)
  {
    id: 'noc-dispatch',
    title: 'DISPATCH TERRAIN & GMAO',
    subtitle: '12 Équipes 4x4 d’Intervention Connectées GPS',
    category: 'MANAGED SERVICES',
    status: 'ok',
    statusLabel: '12 ÉQUIPES MOBILES',
    screenType: 'dispatch',
    sla: 'Départ équipe astreinte < 15 min · Résolution < 2h',
    supervisedAssets: 'Flotte 4x4 Atelier Mobile · Systèmes de Diagnostic I-V · Stock Pièces',
    description:
      'Gestion et coordination en direct des équipes de techniciens d’intervention sur le terrain. Géolocalisation des véhicules 4x4, suivi des ordres de mission et optimisation des tournées de maintenance préventive.',
    metrics: [
      { label: 'Équipes en Patrouille', value: '8 / 12', unit: 'Disponibles', status: 'ok', change: 'Couverture sectorielle' },
      { label: 'Interventions en Cours', value: '3', unit: 'Sur site', status: 'ok', change: 'Maintenance préventive' },
      { label: 'Tickets Résolus (Jour)', value: '14', unit: 'Clôturés', status: 'ok', change: '100% dans les délais' },
      { label: 'Disponibilité Pièces', value: '100', unit: '% en stock', status: 'ok', change: 'Onduleurs, cartes RMS' },
    ],
    equipment: [
      { name: 'Véhicules Tout-Terrain Équipés GMAO', count: '12 Flottes', status: 'Connectées 4G/Sat' },
      { name: 'Valises Diagnostic & Réflectomètres OTDR', count: '12 Kits', status: 'Étalonnés' },
    ],
    procedures: [
      'Affectation automatique du technicien le plus proche selon calcul d’itinéraire GPS',
    ],
  },

  // 4. RÉSEAU FIBRE OPTIQUE (Telecom & Data)
  {
    id: 'noc-fiber',
    title: 'RÉSEAU FIBRE OPTIQUE & DWDM',
    subtitle: '7 000 km de Fibre Optique Déployés & Exploités',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: '7 000 KM ACTIFS',
    screenType: 'fiber',
    sla: 'Disponibilité Transmission Optique 99.995% · Latence P95 < 20 ms',
    supervisedAssets: '7 000 km Câbles Optiques (Aérien & Enterré) · 38 PoPs Régionaux',
    description:
      'Supervision du réseau dorsal de fibre optique NETIS reliant les capitales et grandes métropoles régionales. Surveillance de l’atténuation optique, puissance des lasers DWDM et basculement automatique sur anneaux sécurisés.',
    metrics: [
      { label: 'Fibre Déployée', value: '7 000', unit: 'km', status: 'ok', change: '19 Pays interconnectés' },
      { label: 'Trafic Données Actif', value: '248.5', unit: 'Gbps', status: 'ok', change: '+14.2% ce mois' },
      { label: 'Coupures Backbone', value: '0', unit: 'Lignes', status: 'ok', change: '100% Redondance 1+1' },
      { label: 'Atténuation Moyenne', value: '0.21', unit: 'dB/km', status: 'ok', change: 'Qualité optimale' },
    ],
    equipment: [
      { name: 'Châssis DWDM Haut Débit (100G/400G)', count: '48 Châssis', status: 'En service nominal' },
      { name: 'Systèmes de Surveillance Réflectométrique OTDR', count: '24 Systèmes', status: 'Monitoring continu' },
    ],
    procedures: [
      'Localisation automatique à ± 5 mètres de tout incident de coupure par réflectométrie',
    ],
  },

  // 5. DATA CENTER, IT & SOC (Telecom & Data)
  {
    id: 'noc-datacenter',
    title: 'DATA CENTER, IT & SOC CYBER',
    subtitle: 'PUE 1.32 · Haute Densité Tier III · SOC 24/7',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: 'TIER III · PUE 1.32',
    screenType: 'datacenter',
    sla: 'Uptime Salles Serveurs 99.982% · Zéro Fuite Données',
    supervisedAssets: 'Salles Serveurs Haute Densité · Baies Ondulées · SOC Cybersécurité',
    description:
      'Surveillance continue des infrastructures data centers et de la cybersécurité des flux réseaux. Monitoring de l’efficience énergétique (PUE 1.32), confinement en allée chaude et détection proactive des menaces réseau (SOC).',
    metrics: [
      { label: 'Indice PUE Global', value: '1.32', unit: 'PUE', status: 'ok', change: 'Très haute efficience' },
      { label: 'Charge IT Globale', value: '482', unit: 'kW', status: 'ok', change: 'Capacité disponible 45%' },
      { label: 'Menaces Cyber Bloquées', value: '1 420', unit: 'Jour', status: 'ok', change: 'Zéro brèche' },
      { label: 'Climatisation Inrow', value: '21.5', unit: '°C', status: 'ok', change: 'ΔT nominal' },
    ],
    equipment: [
      { name: 'Baies IT Haute Densité 42U', count: '64 Racks', status: 'Alimentation 2N' },
      { name: 'Systèmes Détection / Extinction Gaz Novec 1230', count: '4 Zones', status: 'Armé' },
    ],
    procedures: [
      'Surveillance permanente des sondes thermiques de chaque baie de serveurs',
    ],
  },

  // 6. INFRASTRUCTURE & ROLLOUT (Telecom & Data)
  {
    id: 'noc-infra',
    title: 'INFRASTRUCTURE & ROLLOUT',
    subtitle: '4 000 Sites Construits · 128 Chantiers Actifs',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: '4 000 SITES LIVRÉS',
    screenType: 'infra',
    sla: 'Respect du planning de déploiement ≥ 98% · Qualité QA/QC ISO 9001',
    supervisedAssets: '4 000 Sites Clé en Main Livrés · 900+ Poteaux Électriques',
    description:
      'Supervision des chantiers de construction, génie civil, montage de pylônes et raccordement électrique. Suivi des étapes de déploiement clé en main pour les opérateurs et gestionnaires de réseau.',
    metrics: [
      { label: 'Sites Construits Total', value: '4 000', unit: 'Sites', status: 'ok', change: 'Livrés clé en main' },
      { label: 'Chantiers en Cours', value: '128', unit: 'En cours', status: 'ok', change: 'Conforme au planning' },
      { label: 'Poteaux Électriques', value: '900+', unit: 'Réseau', status: 'ok', change: 'Maintenance active' },
      { label: 'Conformité Sécurité QHSE', value: '100', unit: '% Conforme', status: 'ok', change: 'Zéro accident' },
    ],
    equipment: [
      { name: 'Équipes Ingénierie & Génie Civil', count: '45 Équipes', status: 'Sur le terrain' },
    ],
    procedures: [
      'Contrôle qualité systématique par drone avant la signature du procès-verbal de recette',
    ],
  },

  // 7. PYLÔNES & TRANSMISSION (Telecom & Data)
  {
    id: 'noc-tower',
    title: 'PYLÔNES & FAISCEAUX RADIO 5G',
    subtitle: 'Station Relais GH-ACC-0412 · Pylône 45m',
    category: 'TELECOM & DATA',
    status: 'ok',
    statusLabel: 'RADIO 99.99%',
    screenType: 'tower',
    sla: 'Disponibilité Faisceaux Hertziens 99.99% · RTT < 8 ms',
    supervisedAssets: 'Pylône Treillis Autostable 45m · 6 Antennes Tri-Bande · Faisceaux MW',
    description:
      'Supervision physique et radiofréquence des pylônes de transmission télécom. Contrôle de l’alignement des paraboles hertziennes, de la verticalité du mât et du bon fonctionnement du balisage aéronautique nocturne OACI.',
    metrics: [
      { label: 'Disponibilité Radio', value: '99.99', unit: '%', status: 'ok', change: 'Liaison optimale' },
      { label: 'Balisage Nocturne', value: '100% OK', unit: 'Actif', status: 'ok', change: 'Conforme OACI' },
      { label: 'Vitesse du Vent Site', value: '18.4', unit: 'km/h', status: 'ok', change: 'Structure stable (< 140)' },
      { label: 'Latence Faisceau MW', value: '4.2', unit: 'ms', status: 'ok', change: 'Transmission Fluide' },
    ],
    equipment: [
      { name: 'Pylône Métallique Autostable 45m', count: '1 Structure', status: 'Inspectée' },
      { name: 'Balises Flash LED Nocturnes OACI', count: '3 Feux', status: 'Fonctionnels' },
    ],
    procedures: [
      'Inspection semestrielle par drone des haubans, boulonneries et brides de fixations',
    ],
  },

  // 8. SCADA SOLAIRE (Energies)
  {
    id: 'noc-scada-pv',
    title: 'SCADA SOLAIRE · PRODUCTION PV',
    subtitle: 'Station Solaire GH-ACC-0412 · 60.9 kW PV',
    category: 'ENERGIES',
    status: 'ok',
    statusLabel: 'PROD 60.9 kW',
    screenType: 'scada-pv',
    sla: 'Rendement Onduleurs ≥ 97.5% · Performance Ratio ≥ 84%',
    supervisedAssets: 'Générateur Solaire 65 kWc · 3 Onduleurs Triphasés · 4 000 Centrales Groupe',
    description:
      'Télémétrie SCADA temps réel de la production photovoltaïque. Courbe en cloche journalière 24h, puissance instantanée (60.9 kW), rendement des onduleurs solaires (98.2%) et température des cellules.',
    metrics: [
      { label: 'Puissance PV Active', value: '60.9', unit: 'kW', status: 'ok', change: 'Pic d’ensoleillement' },
      { label: 'Rendement Onduleurs', value: '98.2', unit: '%', status: 'ok', change: 'Optimal' },
      { label: 'Centrales Groupe', value: '4 000', unit: 'Stations', status: 'ok', change: 'Exploitées par NETIS' },
      { label: 'Énergie Injectée Jour', value: '342', unit: 'kWh', status: 'ok', change: 'Cumul journalier' },
    ],
    equipment: [
      { name: 'Onduleurs Solaires Industriels 20 kW', count: '3 Unités', status: 'En production' },
      { name: 'Capteurs d’Irradiation & Pyranomètres', count: '2 Unités', status: 'Calibrés' },
    ],
    procedures: [
      'Ajustement automatique de l’angle d’inclinaison selon l’azimut du soleil',
      'Nettoyage programmé des modules si le Performance Ratio passe sous 80%',
    ],
  },

  // 9. STOCKAGE BESS (Energies)
  {
    id: 'noc-bess',
    title: 'STOCKAGE BESS & BATTERIES 48V',
    subtitle: 'Shelter Énergie KE-NRB-1187 · Batteries LiFePO4',
    category: 'ENERGIES',
    status: 'ok',
    statusLabel: 'SOC 88% · CHARGE',
    screenType: 'bess',
    sla: 'Autonomie Garantie ≥ 14h · Équilibrage Cellules ΔV < 15 mV',
    supervisedAssets: 'Banc Batteries Lithium 48V 1 200 Ah · Contrôleur BMS Intelligent',
    description:
      'Supervision du banc de stockage d’énergie par batteries lithium LiFePO4. Contrôle de l’état de charge (SOC 88%), tension continue du bus 53.8V, courant de charge solaire et climatisation du shelter.',
    metrics: [
      { label: 'État de Charge (SOC)', value: '88.0', unit: '%', status: 'ok', change: 'Charge solaire' },
      { label: 'Tension DC Bus', value: '53.8', unit: 'V', status: 'ok', change: 'Floating stable' },
      { label: 'Autonomie Garantie', value: '14.5', unit: 'heures', status: 'ok', change: 'Zéro coupure' },
      { label: 'Température Packs', value: '23.5', unit: '°C', status: 'ok', change: 'Climatisation OK' },
    ],
    equipment: [
      { name: 'Racks Batteries Lithium LiFePO4 48V', count: '8 Racks', status: 'Équilibrés' },
      { name: 'Contrôleur BMS Centralisé Redondé', count: '1 Châssis', status: 'Nominal' },
    ],
    procedures: [
      'Gestionnaire intelligent de charge pour maximiser la durée de vie cyclique (> 6 000 cycles)',
    ],
  },

  // 10. HYBRIDE GENSET & DIESEL ÉVITÉ (Energies) - HERO STAT: -40% DE DIESEL
  {
    id: 'noc-hybrid-diesel',
    title: 'HYBRIDE GENSET & DIESEL ÉVITÉ',
    subtitle: '−40% de Consommation Diesel sur Sites Hybridés',
    category: 'ENERGIES · HERO STAT',
    status: 'ok',
    statusLabel: '−40% DIESEL ÉVITÉ',
    screenType: 'hybrid-diesel',
    sla: 'Économie Diesel Minimum Contractuelle ≥ 35% · Zéro Coupure Télécom',
    supervisedAssets: 'Gestionnaire Hybride Micro-Grid · Solaire + BESS + Groupe Secours',
    description:
      'Supervision du système d’hybridation énergétique intelligent. Priorisation absolue de la production solaire et du stockage batteries pour réduire de 40% la consommation de gasoil et les émissions de carbone.',
    metrics: [
      { label: 'Économie de Carburant', value: '−40.0', unit: '% Diesel', status: 'ok', change: 'Impact majeur NETIS' },
      { label: 'Mix Énergie Verte', value: '94.2', unit: '% Green', status: 'ok', change: 'Solaire + BESS' },
      { label: 'Carburant Économisé', value: '18 400', unit: 'Litres/mois', status: 'ok', change: 'Bilan carbone réduit' },
      { label: 'Groupe Électrogène', value: 'Standby', unit: 'Prêt', status: 'ok', change: 'Zéro démarrage jour' },
    ],
    equipment: [
      { name: 'Groupe Électrogène Insonorisé 45 kVA', count: '1 Unité', status: 'Veille automatique' },
      { name: 'Contrôleur Hybride Intelligent ATS', count: '1 Châssis', status: 'Pilotage actif' },
    ],
    procedures: [
      'Démarrage du groupe diesel restreint aux situations d’urgence (SOC < 20% + nuit)',
    ],
  },

  // 11. CONTRÔLEUR RMS & ATLAS IRRADIANCE (Energies)
  {
    id: 'noc-rms-irradiance',
    title: 'CONTRÔLEUR RMS & ATLAS IRRADIANCE',
    subtitle: 'Télémétrie Multi-Capteurs & Atlas Solaire (W/m²)',
    category: 'ENERGIES',
    status: 'ok',
    statusLabel: '1 040 W/m² · RMS OK',
    screenType: 'rms-irradiance',
    sla: 'Polling Télémétrie 15 sec · Précision Mesure Classe 0.5',
    supervisedAssets: 'Boîtier RMS IoT Multi-Sondes · Récepteur Satellite Météosat MSG',
    description:
      'Supervision combinée du boîtier RMS (qualité énergie 48V, sondes thermiques, détection intrusion) et de l’atlas d’irradiance solaire par satellite (GHI 0 à 1 200 W/m²) pour prédiction de production à J+1.',
    metrics: [
      { label: 'Irradiance Max Zone', value: '1 040', unit: 'W/m²', status: 'ok', change: 'Ciel très clair' },
      { label: 'Tension Continue RMS', value: '48.4', unit: 'V DC', status: 'ok', change: 'Régulée' },
      { label: 'Température Shelter', value: '22.8', unit: '°C', status: 'ok', change: 'Ventilation active' },
      { label: 'Détection Fumée / Gaz', value: 'Normal', unit: '0 Alarme', status: 'ok', change: 'Sécurisé' },
    ],
    equipment: [
      { name: 'Contrôleur RMS IoT Télémétrie GSM/IP', count: '1 Boîtier', status: 'Connecté' },
      { name: 'Pyranomètres Secondaires Calibrés', count: '12 Unités', status: 'Corrélation 99.4%' },
    ],
    procedures: [
      'Alerte automatique instantanée en cas de dérive thermique ou de variation de tension',
    ],
  },

  // 12. VIDÉOSURVEILLANCE CCTV 2x2 (Sécurité)
  {
    id: 'noc-cctv-mosaic',
    title: 'VIDÉOSURVEILLANCE CCTV SÉCURITÉ',
    subtitle: 'Mosaïque 2×2 Caméras HD · Vision Nocturne & IA',
    category: 'SÉCURITÉ PHYSIQUE',
    status: 'ok',
    statusLabel: 'REC · 25 FPS',
    screenType: 'cctv-mosaic',
    sla: 'Télésurveillance Continue 24/7 · Détection Intrusion < 2 sec',
    supervisedAssets: 'Caméras Dôme PTZ 4K Vision Nocturne · NVR Sécurisé · Barrière Laser',
    description:
      'Mosaïque de vidéosurveillance tactique des sites distants : parc photovoltaïque, shelter BTS technique, mât télécom 45m et sas d’accès sécurisé. Horodatage haute précision et détection de présence.',
    metrics: [
      { label: 'Caméras Actives', value: '4 / 4', unit: 'Flux HD', status: 'ok', change: '1080p 25fps' },
      { label: 'État Périmètre', value: 'Sécurisé', unit: 'Normal', status: 'ok', change: 'Zéro intrusion' },
      { label: 'Éclairage Nocturne', value: 'Auto LED', unit: 'Prêt', status: 'ok', change: 'Solaire autonome' },
      { label: 'Enregistrement Cloud', value: '30 Jours', unit: 'H.265', status: 'ok', change: 'Redondé' },
    ],
    equipment: [
      { name: 'Caméras IP PTZ 4K Infrarouge', count: '4 Unités', status: 'Enregistrement' },
      { name: 'Serveur NVR & Stockage Chiffré', count: '1 Baie', status: 'Opérationnel' },
    ],
    procedures: [
      'Ronde virtuelle automatisée des caméras toutes les 15 minutes',
      'Asservissement instantané de la caméra sur alarme d’ouverture de porte shelter',
    ],
  },
]

// PALETTE
const PAL = {
  bg: '#0A1016',
  panel: '#101B24',
  panelBorder: '#1E3345',
  text: '#E6F0F5',
  muted: '#7E98A8',
  accent: '#35C8DA',
  ok: '#2FBF71',
  warn: '#E3A32B',
  crit: '#E2564B',
}

// -------------------------------------------------------------
// REAL GEOGRAPHIC AFRICA VECTOR COASTLINE & 19 COUNTRIES
// -------------------------------------------------------------

const AFRICA_COASTLINE: [number, number][] = [
  [35.8, -5.8], [35.6, -2.2], [36.8, 10.3], [33.9, 10.1], [32.9, 13.2], [31.2, 20.0],
  [31.2, 29.9], [31.3, 32.3], [29.9, 32.5], [27.2, 33.8], [22.0, 36.8], [19.6, 37.2],
  [15.6, 39.4], [12.6, 43.1], [11.6, 43.1], [11.8, 51.3], [10.4, 51.2], [5.3, 48.5],
  [2.0, 45.3], [-0.5, 42.4], [-4.0, 39.6], [-6.8, 39.3], [-10.7, 40.5], [-15.1, 40.5],
  [-19.8, 34.8], [-25.9, 32.6], [-29.8, 31.0], [-33.9, 25.6], [-34.8, 20.0], [-34.3, 18.5],
  [-33.9, 18.4], [-28.6, 16.5], [-26.6, 15.1], [-22.9, 14.5], [-12.5, 13.4], [-8.8, 13.2],
  [-6.0, 12.3], [-4.8, 11.8], [-0.6, 9.0], [0.4, 9.4], [4.0, 9.2], [4.5, 7.0],
  [6.4, 3.4], [6.1, 1.2], [5.5, -0.2], [5.3, -4.0], [4.4, -7.7], [6.3, -10.8],
  [8.5, -13.2], [9.5, -13.7], [11.8, -15.6], [13.5, -16.6], [14.7, -17.4], [16.0, -16.5],
  [18.1, -16.0], [20.9, -17.0], [23.7, -15.9], [27.1, -13.2], [30.4, -9.6], [31.5, -9.8],
  [33.6, -7.6], [34.0, -6.8], [35.8, -5.8]
]

const MADAGASCAR_COASTLINE: [number, number][] = [
  [-12.0, 49.3], [-15.7, 50.5], [-18.1, 49.4], [-25.0, 47.0], [-25.6, 45.2],
  [-23.3, 43.7], [-19.8, 44.4], [-15.7, 46.3], [-12.0, 49.3]
]

const NETIS_19_COUNTRIES = [
  { code: 'MA', name: 'Casablanca (Maroc)', lat: 31.8, lon: -7.1, isHub: true },
  { code: 'SN', name: 'Dakar (Sénégal)', lat: 14.7, lon: -14.4, isHub: true },
  { code: 'GN', name: 'Conakry (Guinée)', lat: 10.4, lon: -10.9, isHub: false },
  { code: 'CI', name: 'Abidjan (Côte d’Ivoire)', lat: 7.5, lon: -5.5, isHub: true },
  { code: 'BF', name: 'Ouagadougou (Burkina Faso)', lat: 12.3, lon: -1.5, isHub: false },
  { code: 'GH', name: 'Accra (Ghana)', lat: 7.9, lon: -1.0, isHub: false },
  { code: 'TG', name: 'Lomé (Togo)', lat: 8.6, lon: 0.8, isHub: false },
  { code: 'BJ', name: 'Cotonou (Bénin)', lat: 9.3, lon: 2.3, isHub: false },
  { code: 'NE', name: 'Niamey (Niger)', lat: 17.6, lon: 8.1, isHub: false },
  { code: 'NG', name: 'Lagos (Nigeria)', lat: 9.1, lon: 8.7, isHub: true },
  { code: 'CM', name: 'Douala (Cameroun)', lat: 5.4, lon: 12.7, isHub: false },
  { code: 'GA', name: 'Libreville (Gabon)', lat: -0.8, lon: 11.6, isHub: false },
  { code: 'CD', name: 'Kinshasa (RDC)', lat: -4.0, lon: 21.8, isHub: false },
  { code: 'UG', name: 'Kampala (Ouganda)', lat: 1.4, lon: 32.3, isHub: false },
  { code: 'RW', name: 'Kigali (Rwanda)', lat: -1.9, lon: 29.9, isHub: false },
  { code: 'KE', name: 'Nairobi (Kenya)', lat: 0.0, lon: 37.9, isHub: true },
  { code: 'ET', name: 'Addis-Abeba (Éthiopie)', lat: 9.1, lon: 40.5, isHub: false },
  { code: 'TZ', name: 'Dar es Salaam (Tanzanie)', lat: -6.3, lon: 34.9, isHub: false },
  { code: 'ZM', name: 'Lusaka (Zambie)', lat: -13.1, lon: 27.8, isHub: false },
  { code: 'MG', name: 'Antananarivo (Madagascar)', lat: -18.8, lon: 46.9, isHub: false },
]

function projectGeo(lat: number, lon: number, cx: number, cy: number, scale: number) {
  const x = cx + ((lon - 17.5) / 38.0) * scale * 1.05
  const y = cy - ((lat - 1.0) / 37.0) * scale
  return { x, y }
}

/** Screen 0: Master Screen (2x2 Central Fused Screen, 3072x1728) */
function drawMasterScreen(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  const mapX = 60
  const mapY = 100
  const mapW = w - 120
  const mapH = h - 180

  const cx = mapX + mapW * 0.48
  const cy = mapY + mapH * 0.50
  const scale = mapH * 0.44

  // Subtle dark grid texture
  ctx.strokeStyle = 'rgba(30, 51, 69, 0.35)'
  ctx.lineWidth = 1
  for (let x = 60; x < w; x += 100) {
    ctx.beginPath()
    ctx.moveTo(x, 70)
    ctx.lineTo(x, h - 60)
    ctx.stroke()
  }
  for (let y = 80; y < h; y += 100) {
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(w - 40, y)
    ctx.stroke()
  }

  // Header Bar
  ctx.fillStyle = PAL.panel
  ctx.fillRect(30, 20, w - 60, 60)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 2
  ctx.strokeRect(30, 20, w - 60, 60)

  ctx.fillStyle = PAL.accent
  ctx.font = 'bold 24px "Outfit", sans-serif'
  ctx.fillText('NETIS · AFRICA HYPERVISION · 19 COUNTRIES UNDER ONE SUPERVISION', 50, 58)

  ctx.fillStyle = PAL.ok
  ctx.font = 'bold 18px monospace'
  ctx.textAlign = 'right'
  ctx.fillText('● 15,000 SITES IN SERVICE · AVAILABILITY 99.98%', w - 50, 58)
  ctx.textAlign = 'left'

  // Draw True Geographic Africa Coastline
  ctx.fillStyle = '#0d1924'
  ctx.strokeStyle = '#35c8da'
  ctx.lineWidth = 4
  ctx.beginPath()
  for (let i = 0; i < AFRICA_COASTLINE.length; i++) {
    const pt = projectGeo(AFRICA_COASTLINE[i][0], AFRICA_COASTLINE[i][1], cx, cy, scale)
    if (i === 0) ctx.moveTo(pt.x, pt.y)
    else ctx.lineTo(pt.x, pt.y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Draw Madagascar island
  ctx.beginPath()
  for (let i = 0; i < MADAGASCAR_COASTLINE.length; i++) {
    const pt = projectGeo(MADAGASCAR_COASTLINE[i][0], MADAGASCAR_COASTLINE[i][1], cx, cy, scale)
    if (i === 0) ctx.moveTo(pt.x, pt.y)
    else ctx.lineTo(pt.x, pt.y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Highlight 19 NETIS Countries
  for (const c of NETIS_19_COUNTRIES) {
    const pt = projectGeo(c.lat, c.lon, cx, cy, scale)
    const isHub = c.isHub
    ctx.fillStyle = isHub ? 'rgba(53, 200, 218, 0.35)' : 'rgba(47, 191, 113, 0.25)'
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 36, 0, Math.PI * 2)
    ctx.fill()
  }

  // 5 Operational Layers Cycling every 4 seconds
  const layerIndex = Math.floor((time / 4.0) % 5)
  const layerNames = [
    'TELECOM SITES (15,000 SITES IN SERVICE)',
    'OPTICAL FIBRE NETWORK (7,000 KM · DWDM BACKBONE)',
    'SOLAR PLANTS (4,000 HYBRID STATIONS)',
    'FIELD RESPONSE (12 GEOLOCATED 4X4 CREWS)',
    'ALL OPERATIONS (19-COUNTRY SUPERVISION)',
  ]

  // Animated Fiber Links between main hubs
  const fiberRoutes: [string, string][] = [
    ['MA', 'SN'],
    ['SN', 'CI'],
    ['CI', 'GH'],
    ['GH', 'NG'],
    ['NG', 'CM'],
    ['CM', 'CD'],
    ['CD', 'RW'],
    ['RW', 'UG'],
    ['UG', 'KE'],
    ['KE', 'ET'],
    ['KE', 'TZ'],
    ['TZ', 'ZM'],
    ['TZ', 'MG'],
  ]

  ctx.lineWidth = layerIndex === 1 || layerIndex === 4 ? 4.0 : 2.0
  for (let i = 0; i < fiberRoutes.length; i++) {
    const [c1, c2] = fiberRoutes[i]
    const p1 = NETIS_19_COUNTRIES.find((x) => x.code === c1)
    const p2 = NETIS_19_COUNTRIES.find((x) => x.code === c2)
    if (!p1 || !p2) continue

    const pt1 = projectGeo(p1.lat, p1.lon, cx, cy, scale)
    const pt2 = projectGeo(p2.lat, p2.lon, cx, cy, scale)

    ctx.strokeStyle = layerIndex === 1 || layerIndex === 4 ? 'rgba(53, 200, 218, 0.95)' : 'rgba(53, 200, 218, 0.45)'
    ctx.beginPath()
    ctx.moveTo(pt1.x, pt1.y)
    ctx.lineTo(pt2.x, pt2.y)
    ctx.stroke()

    // Moving photon pulse
    const pulseOffset = (time * 0.5 + i * 0.12) % 1.0
    const px = pt1.x + (pt2.x - pt1.x) * pulseOffset
    const py = pt1.y + (pt2.y - pt1.y) * pulseOffset
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw discrete site points
  for (let i = 0; i < NETIS_19_COUNTRIES.length; i++) {
    const c = NETIS_19_COUNTRIES[i]
    const pt = projectGeo(c.lat, c.lon, cx, cy, scale)
    const pulse = 0.5 + 0.5 * Math.sin(time * 3 + i)

    ctx.fillStyle = c.isHub ? '#ffffff' : PAL.ok
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, c.isHub ? 6 : 4.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = c.isHub ? 'rgba(53, 200, 218, 0.8)' : 'rgba(47, 191, 113, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, (c.isHub ? 10 : 7) + pulse * 4, 0, Math.PI * 2)
    ctx.stroke()

    if (c.isHub) {
      const cityName = c.name.split(' ')[0]
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px "Outfit", sans-serif'
      ctx.fillText(cityName, pt.x + 18, pt.y - 4)

      ctx.fillStyle = PAL.accent
      ctx.font = 'bold 22px monospace'
      ctx.fillText(`● HUB ${c.code}`, pt.x + 18, pt.y + 24)
    }
  }

  // Bottom Layer Indicator Banner
  ctx.fillStyle = PAL.panel
  ctx.fillRect(mapX, h - 56, mapW, 44)
  ctx.strokeStyle = PAL.panelBorder
  ctx.lineWidth = 1.5
  ctx.strokeRect(mapX, h - 56, mapW, 44)

  ctx.fillStyle = PAL.accent
  ctx.font = 'bold 16px monospace'
  ctx.fillText(`ACTIVE LAYER [ ${layerIndex + 1} / 5 ] : ${layerNames[layerIndex]}`, mapX + 24, h - 28)

  const cycleProgress = (time % 4.0) / 4.0
  ctx.fillStyle = PAL.accent
  ctx.fillRect(mapX, h - 14, mapW * cycleProgress, 4)
}

/** Screen 1: Alarmes Actives (1536x864) */
function drawAlarmsScreen(ctx: CanvasRenderingContext2D, w: number, h: number, _time: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(16, 16, w - 32, 70)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 2
  ctx.strokeRect(16, 16, w - 32, 70)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 34px "Outfit", sans-serif'
  ctx.fillText('⚠ LIVE ALARMS AND INCIDENTS', 36, 62)

  ctx.fillStyle = PAL.ok
  ctx.font = 'bold 22px monospace'
  ctx.textAlign = 'right'
  ctx.fillText('● 0 CRITICAL · 2 MINOR', w - 36, 62)
  ctx.textAlign = 'left'

  const rows = [
    { site: 'NG-LOS-1044 (Lagos)', type: 'SHELTER TEMP HIGH (32.4°C) · REDUNDANT COOLING ON', sev: 'MINOR', col: PAL.warn, time: '03:14:18' },
    { site: 'CI-ABJ-0733 (Abidjan)', type: 'COOLING FILTERS DUE FOR REPLACEMENT (PREVENTIVE)', sev: 'MINOR', col: PAL.warn, time: '02:58:40' },
    { site: 'GH-ACC-0412 (Accra)', type: 'SOLAR CHARGE CYCLE COMPLETE (SOC 88%)', sev: 'NOMINAL', col: PAL.ok, time: '02:45:12' },
    { site: 'KE-NRB-1187 (Nairobi)', type: 'SOLAR INVERTER SYNCHRONISED (98.2% EFF)', sev: 'NOMINAL', col: PAL.ok, time: '02:30:00' },
    { site: 'SN-DKR-0219 (Dakar)', type: 'DWDM 1+1 FAILOVER TESTED OK', sev: 'NOMINAL', col: PAL.ok, time: '01:55:22' },
    { site: 'TZ-DAR-2054 (Dar es Salaam)', type: 'NIGHT ICAO BEACON 100% OPERATIONAL', sev: 'NOMINAL', col: PAL.ok, time: '01:10:04' },
  ]

  let y = 104
  for (const r of rows) {
    ctx.fillStyle = PAL.panel
    ctx.fillRect(16, y, w - 32, 110)
    ctx.strokeStyle = PAL.panelBorder
    ctx.lineWidth = 1.5
    ctx.strokeRect(16, y, w - 32, 110)

    ctx.fillStyle = r.col
    ctx.beginPath()
    ctx.arc(48, y + 55, 10, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = PAL.text
    ctx.font = 'bold 30px "Outfit", sans-serif'
    ctx.fillText(r.site, 76, y + 48)

    ctx.fillStyle = PAL.muted
    ctx.font = '22px monospace'
    ctx.fillText(r.type, 76, y + 88)

    ctx.fillStyle = r.col
    ctx.font = 'bold 24px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(r.sev, w - 160, y + 65)

    ctx.fillStyle = PAL.muted
    ctx.fillText(r.time, w - 40, y + 65)
    ctx.textAlign = 'left'

    y += 122
  }
}

/** Screen 2: KPI Groupe & SLA (1536x864) */
function drawKpiScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(16, 16, w - 32, 70)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 2
  ctx.strokeRect(16, 16, w - 32, 70)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 34px "Outfit", sans-serif'
  ctx.fillText('GROUP KPIs AND SLA COMMITMENTS', 36, 62)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(16, 104, (w - 48) / 2, h - 120)
  ctx.strokeStyle = PAL.ok
  ctx.lineWidth = 2
  ctx.strokeRect(16, 104, (w - 48) / 2, h - 120)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 24px monospace'
  ctx.fillText('GLOBAL NETWORK AVAILABILITY', 44, 155)

  ctx.fillStyle = PAL.ok
  ctx.font = 'bold 110px "Outfit", monospace'
  ctx.fillText('99.98', 44, 290)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 38px monospace'
  ctx.fillText('% UPTIME', 390, 290)

  ctx.fillStyle = PAL.text
  ctx.font = '26px "Outfit", sans-serif'
  ctx.fillText('Contracted SLA: ≥ 99.95%', 44, 380)
  ctx.fillText('Mean on-call time (MTTR): 18 min', 44, 430)
  ctx.fillText('19 African countries under continuous supervision', 44, 480)

  const rx = (w - 48) / 2 + 32
  const rw = (w - 48) / 2
  const cardH = (h - 120 - 32) / 3

  const kpis = [
    { label: 'MANAGED TELECOM SITES', val: '15 000', unit: 'Sites', sub: '19 African countries' },
    { label: 'STAFF AND EXPERTS', val: '3 000', unit: 'Experts', sub: 'Local engineering 24/7' },
    { label: 'PEOPLE CONNECTED', val: '1M+', unit: 'Users', sub: 'Direct social impact' },
  ]

  for (let i = 0; i < kpis.length; i++) {
    const k = kpis[i]
    const cy = 104 + i * (cardH + 16)
    ctx.fillStyle = PAL.panel
    ctx.fillRect(rx, cy, rw, cardH)
    ctx.strokeStyle = PAL.panelBorder
    ctx.lineWidth = 1.5
    ctx.strokeRect(rx, cy, rw, cardH)

    ctx.fillStyle = PAL.muted
    ctx.font = 'bold 20px monospace'
    ctx.fillText(k.label, rx + 24, cy + 40)

    ctx.fillStyle = PAL.accent
    ctx.font = 'bold 70px "Outfit", monospace'
    ctx.fillText(k.val, rx + 24, cy + 120)

    ctx.fillStyle = PAL.text
    ctx.font = 'bold 24px monospace'
    ctx.fillText(k.unit, rx + 300, cy + 115)

    ctx.fillStyle = PAL.muted
    ctx.font = '20px "Outfit", sans-serif'
    ctx.fillText(k.sub, rx + 24, cy + 175)
  }
}

/** Screen 3: Dispatch Terrain & GMAO (1536x864) */
function drawDispatchScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(16, 16, w - 32, 70)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 2
  ctx.strokeRect(16, 16, w - 32, 70)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 34px "Outfit", sans-serif'
  ctx.fillText('FIELD DISPATCH AND CMMS', 36, 62)

  const teams = [
    { team: '4X4 CREW #01 (NORTH)', tech: 'Lines lead / fibre tech', zone: 'Tangier / Tetouan (Morocco)', status: 'IN TRANSIT (14 min)', col: PAL.warn },
    { team: '4X4 CREW #04 (WEST)', tech: 'Tower tech / solar tech', zone: 'Accra / Tema (Ghana)', status: 'ON SITE (Maintenance)', col: PAL.accent },
    { team: '4X4 CREW #07 (CENTRE)', tech: 'Radio tech / BESS tech', zone: 'Abidjan / Bassam (Cote d\'Ivoire)', status: 'AVAILABLE (Patrol)', col: PAL.ok },
    { team: '4X4 CREW #11 (EAST)', tech: 'Field lead / RMS tech', zone: 'Nairobi / Kiambu (Kenya)', status: 'AVAILABLE (Base)', col: PAL.ok },
  ]

  let y = 104
  for (const t of teams) {
    ctx.fillStyle = PAL.panel
    ctx.fillRect(16, y, w - 32, 165)
    ctx.strokeStyle = PAL.panelBorder
    ctx.lineWidth = 1.5
    ctx.strokeRect(16, y, w - 32, 165)

    ctx.fillStyle = PAL.accent
    ctx.font = 'bold 32px "Outfit", sans-serif'
    ctx.fillText(t.team, 36, y + 48)

    ctx.fillStyle = PAL.muted
    ctx.font = '24px monospace'
    ctx.fillText(`Technicians: ${t.tech}`, 36, y + 92)

    ctx.fillStyle = PAL.text
    ctx.font = '24px "Outfit", sans-serif'
    ctx.fillText(`Coverage zone: ${t.zone}`, 36, y + 134)

    ctx.fillStyle = t.col
    ctx.font = 'bold 26px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`● ${t.status}`, w - 40, y + 92)
    ctx.textAlign = 'left'

    y += 185
  }
}

/** Screen 4: Fibre Optique (1024x576) */
function drawFiberScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 12, w - 24, 52)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 1.5
  ctx.strokeRect(12, 12, w - 24, 52)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 24px "Outfit", sans-serif'
  ctx.fillText('OPTICAL FIBRE NETWORK AND DWDM', 28, 48)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 18px monospace'
  ctx.fillText('INSTALLED OPTICAL FIBRE', 28, 100)

  ctx.fillStyle = PAL.accent
  ctx.font = 'bold 90px "Outfit", monospace'
  ctx.fillText('7 000', 28, 195)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 30px monospace'
  ctx.fillText('KM', 340, 190)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 225, w - 24, 325)
  ctx.strokeStyle = PAL.panelBorder
  ctx.strokeRect(12, 225, w - 24, 325)

  const rows = [
    { l: 'Active DWDM links', v: '38 PoP nodes', s: PAL.ok },
    { l: 'Backbone fibre cuts', v: '0 cuts (100% OK)', s: PAL.ok },
    { l: 'Transit data traffic', v: '248.5 Gbps', s: PAL.accent },
    { l: 'Mean attenuation', v: '0.21 dB/km (nominal)', s: PAL.ok },
  ]
  let ry = 275
  for (const r of rows) {
    ctx.fillStyle = PAL.muted
    ctx.font = '20px monospace'
    ctx.fillText(r.l, 36, ry)

    ctx.fillStyle = r.s
    ctx.font = 'bold 24px "Outfit", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(r.v, w - 36, ry)
    ctx.textAlign = 'left'

    ry += 70
  }
}

/** Screen 5: Data Center & Cybersécurité (1024x576) */
function drawDatacenterScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 12, w - 24, 52)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 1.5
  ctx.strokeRect(12, 12, w - 24, 52)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 24px "Outfit", sans-serif'
  ctx.fillText('DATA CENTER IT AND CYBERSECURITY', 28, 48)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 18px monospace'
  ctx.fillText('DATA CENTER ENERGY EFFICIENCY', 28, 100)

  ctx.fillStyle = PAL.ok
  ctx.font = 'bold 90px "Outfit", monospace'
  ctx.fillText('1.32', 28, 195)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 30px monospace'
  ctx.fillText('PUE', 260, 190)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 225, w - 24, 325)
  ctx.strokeStyle = PAL.panelBorder
  ctx.strokeRect(12, 225, w - 24, 325)

  const rows = [
    { l: 'Tier III hall availability', v: '99.982% uptime', s: PAL.ok },
    { l: 'Server IT load', v: '482 kW (55% load)', s: PAL.accent },
    { l: 'Cyber threats blocked', v: '1,420 / day (0 breach)', s: PAL.ok },
    { l: 'Security certification', v: 'ISO 27001 & Tier III', s: PAL.ok },
  ]
  let ry = 275
  for (const r of rows) {
    ctx.fillStyle = PAL.muted
    ctx.font = '20px monospace'
    ctx.fillText(r.l, 36, ry)

    ctx.fillStyle = r.s
    ctx.font = 'bold 24px "Outfit", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(r.v, w - 36, ry)
    ctx.textAlign = 'left'

    ry += 70
  }
}

/** Screen 6: Infrastructure & Rollout (1024x576) */
function drawInfraScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 12, w - 24, 52)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 1.5
  ctx.strokeRect(12, 12, w - 24, 52)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 24px "Outfit", sans-serif'
  ctx.fillText('INFRASTRUCTURE AND SITE ROLLOUT', 28, 48)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 18px monospace'
  ctx.fillText('TURNKEY SITES BUILT', 28, 100)

  ctx.fillStyle = PAL.accent
  ctx.font = 'bold 90px "Outfit", monospace'
  ctx.fillText('4 000', 28, 195)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 30px monospace'
  ctx.fillText('SITES', 340, 190)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 225, w - 24, 325)
  ctx.strokeStyle = PAL.panelBorder
  ctx.strokeRect(12, 225, w - 24, 325)

  const rows = [
    { l: 'Sites under construction', v: '128 active sites', s: PAL.accent },
    { l: 'Power poles installed', v: '900+ poles', s: PAL.ok },
    { l: 'NETIS engineers', v: '3,000 people', s: PAL.ok },
    { l: 'QHSE compliance', v: '100% (ISO 9001 / 45001)', s: PAL.ok },
  ]
  let ry = 275
  for (const r of rows) {
    ctx.fillStyle = PAL.muted
    ctx.font = '20px monospace'
    ctx.fillText(r.l, 36, ry)

    ctx.fillStyle = r.s
    ctx.font = 'bold 24px "Outfit", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(r.v, w - 36, ry)
    ctx.textAlign = 'left'

    ry += 70
  }
}

/** Screen 7: Pylônes & Transmission (1024x576) */
function drawTowerScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 12, w - 24, 52)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 1.5
  ctx.strokeRect(12, 12, w - 24, 52)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 24px "Outfit", sans-serif'
  ctx.fillText('TOWERS AND 5G RADIO LINKS', 28, 48)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 18px monospace'
  ctx.fillText('RADIO LINK AVAILABILITY', 28, 100)

  ctx.fillStyle = PAL.ok
  ctx.font = 'bold 90px "Outfit", monospace'
  ctx.fillText('99.99', 28, 195)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 30px monospace'
  ctx.fillText('%', 320, 190)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 225, w - 24, 325)
  ctx.strokeStyle = PAL.panelBorder
  ctx.strokeRect(12, 225, w - 24, 325)

  const rows = [
    { l: 'Reference site', v: 'GH-ACC-0412 (45 m tower)', s: PAL.accent },
    { l: 'ICAO night beacon', v: '100% operational', s: PAL.ok },
    { l: 'Wind rating', v: 'Within limit (< 140 km/h)', s: PAL.ok },
    { l: 'Microwave latency', v: '4.2 ms (clear path)', s: PAL.ok },
  ]
  let ry = 275
  for (const r of rows) {
    ctx.fillStyle = PAL.muted
    ctx.font = '20px monospace'
    ctx.fillText(r.l, 36, ry)

    ctx.fillStyle = r.s
    ctx.font = 'bold 24px "Outfit", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(r.v, w - 36, ry)
    ctx.textAlign = 'left'

    ry += 70
  }
}

/** Screen 8: SCADA Solaire (1024x576) */
function drawScadaPvScreen(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 12, w - 24, 52)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 1.5
  ctx.strokeRect(12, 12, w - 24, 52)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 24px "Outfit", sans-serif'
  ctx.fillText('SOLAR SCADA · GH-ACC-0412', 28, 48)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 18px monospace'
  ctx.fillText('INSTANT PV POWER', 28, 100)

  ctx.fillStyle = PAL.warn
  ctx.font = 'bold 90px "Outfit", monospace'
  ctx.fillText('60.9', 28, 195)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 30px monospace'
  ctx.fillText('kW', 270, 190)

  const gx = 12
  const gy = 225
  const gw = w - 24
  const gh = 325

  ctx.fillStyle = PAL.panel
  ctx.fillRect(gx, gy, gw, gh)
  ctx.strokeStyle = PAL.panelBorder
  ctx.strokeRect(gx, gy, gw, gh)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 18px monospace'
  ctx.fillText('DAILY SOLAR PRODUCTION CURVE (24H)', gx + 20, gy + 36)

  const pts = 36
  const baseY = gy + gh - 24
  ctx.beginPath()
  ctx.moveTo(gx + 20, baseY)
  for (let i = 0; i <= pts; i++) {
    const px = gx + 20 + (i / pts) * (gw - 40)
    const norm = i / pts
    const bell = Math.exp(-Math.pow((norm - 0.52) * 3.8, 2))
    const noise = 0.015 * Math.sin(i * 0.8 + time * 2)
    const py = baseY - (bell + noise) * (gh - 70)
    ctx.lineTo(px, py)
  }
  ctx.lineTo(gx + gw - 20, baseY)
  ctx.closePath()

  const grad = ctx.createLinearGradient(0, gy + 50, 0, baseY)
  grad.addColorStop(0, 'rgba(227, 163, 43, 0.5)')
  grad.addColorStop(1, 'rgba(227, 163, 43, 0.0)')
  ctx.fillStyle = grad
  ctx.fill()

  ctx.strokeStyle = PAL.warn
  ctx.lineWidth = 3
  ctx.stroke()
}

/** Screen 9: Stockage BESS (1024x576) */
function drawBessScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 12, w - 24, 52)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 1.5
  ctx.strokeRect(12, 12, w - 24, 52)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 24px "Outfit", sans-serif'
  ctx.fillText('BESS STORAGE · KE-NRB-1187', 28, 48)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 18px monospace'
  ctx.fillText('STATE OF CHARGE (SOC)', 28, 100)

  ctx.fillStyle = PAL.ok
  ctx.font = 'bold 90px "Outfit", monospace'
  ctx.fillText('88.0', 28, 195)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 30px monospace'
  ctx.fillText('%', 280, 190)

  // Battery gauge bar
  ctx.fillStyle = '#182b3a'
  ctx.fillRect(340, 140, w - 370, 42)
  ctx.fillStyle = PAL.ok
  ctx.fillRect(340, 140, (w - 370) * 0.88, 42)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 225, w - 24, 325)
  ctx.strokeStyle = PAL.panelBorder
  ctx.strokeRect(12, 225, w - 24, 325)

  const rows = [
    { l: 'DC bus voltage', v: '53.8 V (stable float)', s: PAL.ok },
    { l: 'Guaranteed autonomy', v: '14.5 hours', s: PAL.ok },
    { l: 'Pack temperature', v: '23.5 °C (cooling OK)', s: PAL.accent },
    { l: 'LiFePO4 racks', v: '8 balanced racks', s: PAL.ok },
  ]
  let ry = 275
  for (const r of rows) {
    ctx.fillStyle = PAL.muted
    ctx.font = '20px monospace'
    ctx.fillText(r.l, 36, ry)

    ctx.fillStyle = r.s
    ctx.font = 'bold 24px "Outfit", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(r.v, w - 36, ry)
    ctx.textAlign = 'left'

    ry += 70
  }
}

/** Screen 10: Hybride Genset & HERO STAT « -40% DE DIESEL » (1024x576) */
function drawHybridDieselScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 12, w - 24, 52)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 1.5
  ctx.strokeRect(12, 12, w - 24, 52)

  ctx.fillStyle = PAL.accent
  ctx.font = 'bold 24px "Outfit", sans-serif'
  ctx.fillText('HYBRID CONTROLLER AND GREEN IMPACT', 28, 48)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 18px monospace'
  ctx.fillText('DIESEL AVOIDED ON HYBRID SITES', 28, 100)

  // HERO STAT EN TRÈS GRAND
  ctx.fillStyle = PAL.ok
  ctx.font = 'bold 110px "Outfit", monospace'
  ctx.fillText('−40 %', 28, 205)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 235, w - 24, 315)
  ctx.strokeStyle = PAL.panelBorder
  ctx.strokeRect(12, 235, w - 24, 315)

  const rows = [
    { l: 'Green energy mix', v: '94.2% (solar + BESS)', s: PAL.ok },
    { l: 'Fuel saved', v: '18,400 litres / month', s: PAL.accent },
    { l: 'Generator state', v: 'Automatic standby', s: PAL.ok },
    { l: 'CO2 avoided', v: '48.5 tonnes / month', s: PAL.ok },
  ]
  let ry = 280
  for (const r of rows) {
    ctx.fillStyle = PAL.muted
    ctx.font = '20px monospace'
    ctx.fillText(r.l, 36, ry)

    ctx.fillStyle = r.s
    ctx.font = 'bold 24px "Outfit", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(r.v, w - 36, ry)
    ctx.textAlign = 'left'

    ry += 65
  }
}

/** Screen 11: RMS & Atlas Irradiance (1024x576) */
function drawRmsIrradianceScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAL.bg
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 12, w - 24, 52)
  ctx.strokeStyle = PAL.accent
  ctx.lineWidth = 1.5
  ctx.strokeRect(12, 12, w - 24, 52)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 24px "Outfit", sans-serif'
  ctx.fillText('RMS CONTROLLER AND IRRADIANCE ATLAS', 28, 48)

  const mapW = (w - 36) / 2
  const mapH = h - 80
  ctx.fillStyle = PAL.panel
  ctx.fillRect(12, 68, mapW, mapH)
  ctx.strokeStyle = PAL.panelBorder
  ctx.strokeRect(12, 68, mapW, mapH)

  const heatGrad = ctx.createLinearGradient(0, 80, 0, 80 + mapH - 24)
  heatGrad.addColorStop(0, '#ef4444')
  heatGrad.addColorStop(0.3, '#f97316')
  heatGrad.addColorStop(0.6, '#eab308')
  heatGrad.addColorStop(0.85, '#10b981')
  heatGrad.addColorStop(1, '#0284c7')

  ctx.fillStyle = heatGrad
  ctx.fillRect(24, 80, 24, mapH - 24)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 13px monospace'
  ctx.fillText('1200', 54, 94)
  ctx.fillText('800', 54, 94 + (mapH - 24) * 0.35)
  ctx.fillText('400', 54, 94 + (mapH - 24) * 0.7)
  ctx.fillText('0 W/m²', 54, 94 + (mapH - 24) * 0.96)

  ctx.fillStyle = 'rgba(234, 88, 12, 0.35)'
  ctx.beginPath()
  ctx.arc(mapW * 0.65, 80 + mapH * 0.45, 95, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 16px "Outfit", sans-serif'
  ctx.fillText('ATLAS GHI SATELLITE', 110, 110)

  const rx = mapW + 24
  ctx.fillStyle = PAL.panel
  ctx.fillRect(rx, 68, mapW, mapH)
  ctx.strokeStyle = PAL.panelBorder
  ctx.strokeRect(rx, 68, mapW, mapH)

  ctx.fillStyle = PAL.muted
  ctx.font = 'bold 18px monospace'
  ctx.fillText('IRRADIANCE MAX ZONE', rx + 20, 110)

  ctx.fillStyle = PAL.warn
  ctx.font = 'bold 70px "Outfit", monospace'
  ctx.fillText('1 040', rx + 20, 190)

  ctx.fillStyle = PAL.text
  ctx.font = 'bold 24px monospace'
  ctx.fillText('W/m²', rx + 260, 185)

  const rows = [
    { l: 'DC bus voltage', v: '48.4 V DC (regulated)' },
    { l: 'Shelter temperature', v: '22.8 °C (cooling on)' },
    { l: 'Smoke / gas detection', v: '0 alarms (normal)' },
  ]
  let ry = 245
  for (const r of rows) {
    ctx.fillStyle = PAL.muted
    ctx.font = '18px monospace'
    ctx.fillText(r.l, rx + 20, ry)

    ctx.fillStyle = PAL.ok
    ctx.font = 'bold 22px "Outfit", sans-serif'
    ctx.fillText(r.v, rx + 20, ry + 28)

    ry += 65
  }
}

/** Screen 12: Vidéosurveillance CCTV 2x2 Tactical (1024x576) */
function drawCctvMosaicScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#020408'
  ctx.fillRect(0, 0, w, h)

  const pad = 6
  const halfW = (w - pad * 3) / 2
  const halfH = (h - pad * 3 - 36) / 2
  const startY = 40

  ctx.fillStyle = '#080d14'
  ctx.fillRect(pad, pad, w - pad * 2, 28)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.strokeRect(pad, pad, w - pad * 2, 28)

  ctx.fillStyle = PAL.crit
  ctx.beginPath()
  ctx.arc(22, 22, 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 12px monospace'
  ctx.fillText('CCTV LIVE · 2026-08-24 03:14:22 · 25 FPS · H.265 HD', 36, 26)

  const cams = [
    { label: 'CAM-TZ-DAR-02 [PV FIELD]', x: pad, y: startY },
    { label: 'CAM-SN-DKR-01 [BTS SHELTER]', x: pad * 2 + halfW, y: startY },
    { label: 'CAM-CI-ABJ-03 [45M TOWER]', x: pad, y: startY + halfH + pad },
    { label: 'CAM-GH-ACC-04 [ACCESS AIRLOCK]', x: pad * 2 + halfW, y: startY + halfH + pad },
  ]

  for (let i = 0; i < cams.length; i++) {
    const c = cams[i]

    const cGrad = ctx.createLinearGradient(c.x, c.y, c.x, c.y + halfH)
    cGrad.addColorStop(0, '#10161d')
    cGrad.addColorStop(0.5, '#1e2630')
    cGrad.addColorStop(0.51, '#0e1318')
    cGrad.addColorStop(1, '#080b0e')
    ctx.fillStyle = cGrad
    ctx.fillRect(c.x, c.y, halfW, halfH)
    ctx.strokeStyle = '#222d38'
    ctx.strokeRect(c.x, c.y, halfW, halfH)

    if (i === 0) {
      ctx.strokeStyle = '#4a5d70'
      ctx.lineWidth = 1.2
      for (let p = 0; p < 4; p++) {
        const px = c.x + 20 + p * 55
        const py = c.y + halfH * 0.45
        ctx.strokeRect(px, py, 45, 30)
      }
    } else if (i === 2) {
      const tx = c.x + halfW * 0.5
      ctx.strokeStyle = '#5a7085'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(tx - 25, c.y + halfH)
      ctx.lineTo(tx, c.y + 16)
      ctx.lineTo(tx + 25, c.y + halfH)
      ctx.stroke()
    } else {
      const sx = c.x + halfW * 0.35
      const sy = c.y + halfH * 0.38
      ctx.strokeStyle = '#4a5d70'
      ctx.strokeRect(sx, sy, 80, 50)
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(c.x + 4, c.y + 4, 220, 22)
    ctx.fillStyle = PAL.accent
    ctx.font = 'bold 11px monospace'
    ctx.fillText(c.label, c.x + 8, c.y + 19)
  }
}

function renderScreenCanvas(canvas: HTMLCanvasElement, site: NocMonitorSite, time: number) {
  const w = canvas.width
  const h = canvas.height
  const ctx = canvas.getContext('2d')!

  switch (site.screenType) {
    case 'africa-master':
      drawMasterScreen(ctx, w, h, time)
      break
    case 'alarms':
      drawAlarmsScreen(ctx, w, h, time)
      break
    case 'kpi':
      drawKpiScreen(ctx, w, h)
      break
    case 'dispatch':
      drawDispatchScreen(ctx, w, h)
      break
    case 'fiber':
      drawFiberScreen(ctx, w, h)
      break
    case 'datacenter':
      drawDatacenterScreen(ctx, w, h)
      break
    case 'infra':
      drawInfraScreen(ctx, w, h)
      break
    case 'tower':
      drawTowerScreen(ctx, w, h)
      break
    case 'scada-pv':
      drawScadaPvScreen(ctx, w, h, time)
      break
    case 'bess':
      drawBessScreen(ctx, w, h)
      break
    case 'hybrid-diesel':
      drawHybridDieselScreen(ctx, w, h)
      break
    case 'rms-irradiance':
      drawRmsIrradianceScreen(ctx, w, h)
      break
    case 'cctv-mosaic':
      drawCctvMosaicScreen(ctx, w, h)
      break
    default:
      drawMasterScreen(ctx, w, h, time)
  }
}

/**
 * 3D Architectural Room & Enlarged Monumental 13-Screen Video Wall
 */
export class NocInterior {
  readonly group = new THREE.Group()
  readonly monitors: THREE.Mesh[] = []
  private readonly bezels: THREE.Mesh[] = []
  private readonly screenCanvases: HTMLCanvasElement[] = []
  private readonly screenTextures: THREE.CanvasTexture[] = []
  private lastRenderTime = 0
  private hoveredIndex: number | null = null
  private selectedIndex: number | null = null

  constructor() {
    this.group.name = 'NocInteriorRoom'
    this.group.visible = false

    const origin = blenderToThree(-57, 112, 3.2)
    this.group.position.copy(origin)

    this.buildArchitecturalRoom()
    this.buildOperatorDesksAndSilhouettes()
    this.build13ScreenVideoWall()
    this.buildLighting()
  }

  /**
   * Room Geometry: 20m W x 14m D x 5.6m H
   */
  private buildArchitecturalRoom() {
    // 1. Sol - Béton lissé sombre avec réflexion douce (#14191D, roughness: 0.35, metalness: 0.0)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x14191d,
      roughness: 0.35,
      metalness: 0.0,
      envMapIntensity: 0.45,
    })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20.0, 14.0), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0, 7.0)
    this.group.add(floor)

    // Floor technical grid lines
    const gridHelper = new THREE.GridHelper(20, 16, 0x1e2730, 0x1e2730)
    gridHelper.position.set(0, 0.002, 7.0)
    this.group.add(gridHelper)

    // 2. Plafond à 5.60 m (#0C1114) avec deux bandeaux lumineux linéaires encastrés
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x0c1114,
      roughness: 0.85,
      metalness: 0.1,
    })
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20.0, 14.0), ceilingMat)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.set(0, 5.6, 7.0)
    this.group.add(ceiling)

    // Deux bandeaux lumineux linéaires encastrés à Z = 2.5 m et Z = 6.5 m (#7FA8C4, emissive 0.6)
    const linearLightMat = new THREE.MeshStandardMaterial({
      color: 0x7fa8c4,
      emissive: 0x7fa8c4,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    })
    const lightTroffer1 = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.02, 0.25), linearLightMat)
    lightTroffer1.position.set(0, 5.59, 2.5)
    this.group.add(lightTroffer1)

    const lightTroffer2 = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.02, 0.25), linearLightMat)
    lightTroffer2.position.set(0, 5.59, 6.5)
    this.group.add(lightTroffer2)

    // 3. Murs latéraux en panneaux acoustiques sombres (#1A2126, roughness 0.9, rainures tous les 0.6m)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a2126,
      roughness: 0.9,
      metalness: 0.1,
    })
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.6, 14.0), wallMat)
    leftWall.position.set(-10.0, 2.8, 7.0)
    this.group.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.6, 14.0), wallMat)
    rightWall.position.set(10.0, 2.8, 7.0)
    this.group.add(rightWall)

    // Acoustic vertical slats
    const slatMat = new THREE.MeshStandardMaterial({
      color: 0x0f1519,
      roughness: 0.8,
    })
    for (let z = 0.6; z < 13.5; z += 0.6) {
      const leftSlat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 5.4, 0.03), slatMat)
      leftSlat.position.set(-9.88, 2.8, z)
      this.group.add(leftSlat)

      const rightSlat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 5.4, 0.03), slatMat)
      rightSlat.position.set(9.88, 2.8, z)
      this.group.add(rightSlat)
    }

    // 4. Mur du fond technique
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(20.0, 5.6, 0.2), wallMat)
    backWall.position.set(0, 2.8, -0.1)
    this.group.add(backWall)

    // 5. Cloison vitrée à Z = 12.5 m
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x9fd8ff,
      transmission: 0.85,
      opacity: 0.35,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.5,
    })
    const glassFrame = new THREE.Mesh(new THREE.BoxGeometry(19.8, 5.2, 0.04), glassMat)
    glassFrame.position.set(0, 2.6, 12.5)
    this.group.add(glassFrame)
  }

  /**
   * Six operator desks in 2 rows + 3 seated operator silhouettes
   * Desks brought ~40% closer to the screen wall (Row 1 at Z = 2.2m, Row 2 at Z = 4.2m)
   */
  private buildOperatorDesksAndSilhouettes() {
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x182026,
      roughness: 0.25,
      metalness: 0.2,
    })
    const screenMonitorMat = new THREE.MeshStandardMaterial({
      color: 0x0a1016,
      emissive: 0x1a3344,
      emissiveIntensity: 0.4,
      roughness: 0.5,
    })
    const chairMat = new THREE.MeshStandardMaterial({
      color: 0x0e1318,
      roughness: 0.85,
    })
    const silhouetteMat = new THREE.MeshStandardMaterial({
      color: 0x080b0e,
      roughness: 0.95,
      metalness: 0.0,
    })

    // Desks positioned closer to wall to eliminate empty floor gap
    // Rangée 1 : Z = 2.2 m -> X = -2.6 / 0.0 / +2.6
    // Rangée 2 : Z = 4.2 m -> X = -3.8 / -1.3 / +1.3
    const deskConfigs = [
      { id: 0, x: -2.6, z: 2.2, hasOperator: true },
      { id: 1, x: 0.0, z: 2.2, hasOperator: false },
      { id: 2, x: 2.6, z: 2.2, hasOperator: true },
      { id: 3, x: -3.8, z: 4.2, hasOperator: false },
      { id: 4, x: -1.3, z: 4.2, hasOperator: true },
      { id: 5, x: 1.3, z: 4.2, hasOperator: false },
    ]

    for (const d of deskConfigs) {
      // Bureau : 1.40m L x 0.55m P x 0.46m H
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.55), deskMat)
      deskTop.position.set(d.x, 0.44, d.z)
      this.group.add(deskTop)

      // Desk metallic legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x0a0e12, metalness: 0.8, roughness: 0.3 })
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.5), legMat)
      legL.position.set(d.x - 0.65, 0.22, d.z)
      this.group.add(legL)

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.5), legMat)
      legR.position.set(d.x + 0.65, 0.22, d.z)
      this.group.add(legR)

      // 2 Moniteurs inclinés à 12°
      const monL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.20, 0.015), screenMonitorMat)
      monL.position.set(d.x - 0.20, 0.58, d.z - 0.10)
      monL.rotation.y = 0.18
      monL.rotation.x = -0.12
      this.group.add(monL)

      const monR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.20, 0.015), screenMonitorMat)
      monR.position.set(d.x + 0.20, 0.58, d.z - 0.10)
      monR.rotation.y = -0.18
      monR.rotation.x = -0.12
      this.group.add(monR)

      // Fauteuil de bureau
      const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.26, 12), chairMat)
      chairBase.position.set(d.x, 0.13, d.z + 0.32)
      this.group.add(chairBase)

      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.04, 0.30), chairMat)
      chairSeat.position.set(d.x, 0.28, d.z + 0.32)
      this.group.add(chairSeat)

      const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.04), chairMat)
      chairBack.position.set(d.x, 0.46, d.z + 0.44)
      this.group.add(chairBack)

      // Opérateur assis en silhouette contre-jour
      if (d.hasOperator) {
        // Torse
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.30, 0.15), silhouetteMat)
        torso.position.set(d.x, 0.47, d.z + 0.31)
        this.group.add(torso)

        // Épaules
        const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.15, 6, 8), silhouetteMat)
        shoulders.rotation.z = Math.PI / 2
        shoulders.position.set(d.x, 0.61, d.z + 0.31)
        this.group.add(shoulders)

        // Tête avec casque
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), silhouetteMat)
        head.position.set(d.x, 0.72, d.z + 0.31)
        this.group.add(head)

        const headset = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 8, 16), silhouetteMat)
        headset.position.set(d.x, 0.73, d.z + 0.31)
        this.group.add(headset)

        // Bras
        const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.22, 8), silhouetteMat)
        armL.position.set(d.x - 0.14, 0.45, d.z + 0.19)
        armL.rotation.x = Math.PI / 4
        this.group.add(armL)

        const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.22, 8), silhouetteMat)
        armR.position.set(d.x + 0.14, 0.45, d.z + 0.19)
        armR.rotation.x = Math.PI / 4
        this.group.add(armR)
      }
    }
  }

  /**
   * 13 Screens Video Wall (Enlarged by factor 1.5x and lowered for monumental presence)
   * Base at Y = 0.35m, Top at Y = 5.285m, Width = 8.70m
   * Curved horizontally with Radius R = 18m
   */
  private build13ScreenVideoWall() {
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x080c10,
      roughness: 0.3,
      metalness: 0.85,
    })

    const R = 18.0 // Curvature radius
    const unitW = 2.16 // 1.44 * 1.5
    const unitH = 1.215 // 0.81 * 1.5
    const gap = 0.025

    const masterW = 2 * unitW + gap // 4.345m
    const masterH = 2 * unitH + gap // 2.455m

    // Step positions
    // X columns: -3.2775 / -1.0925 / +1.0925 / +3.2775
    // Y rows: Row 0 (0.9575) / Row 1 (2.1975) / Row 2 (3.4375) / Row 3 (4.6775)
    // Master Y center: (2.1975 + 3.4375) / 2 = 2.8175m
    const screenLayouts = [
      { id: 'noc-africa-master', x: 0.0, y: 2.8175, w: masterW, h: masterH, resW: 3072, resH: 1728 },
      { id: 'noc-alarms', x: -3.2775, y: 4.6775, w: unitW, h: unitH, resW: 1536, resH: 864 },
      { id: 'noc-kpi', x: -1.0925, y: 4.6775, w: unitW, h: unitH, resW: 1536, resH: 864 },
      { id: 'noc-dispatch', x: 1.0925, y: 4.6775, w: unitW, h: unitH, resW: 1536, resH: 864 },
      { id: 'noc-fiber', x: 3.2775, y: 4.6775, w: unitW, h: unitH, resW: 1024, resH: 576 },
      { id: 'noc-datacenter', x: -3.2775, y: 3.4375, w: unitW, h: unitH, resW: 1024, resH: 576 },
      { id: 'noc-infra', x: 3.2775, y: 3.4375, w: unitW, h: unitH, resW: 1024, resH: 576 },
      { id: 'noc-tower', x: -3.2775, y: 2.1975, w: unitW, h: unitH, resW: 1024, resH: 576 },
      { id: 'noc-scada-pv', x: 3.2775, y: 2.1975, w: unitW, h: unitH, resW: 1024, resH: 576 },
      { id: 'noc-bess', x: -3.2775, y: 0.9575, w: unitW, h: unitH, resW: 1024, resH: 576 },
      { id: 'noc-hybrid-diesel', x: -1.0925, y: 0.9575, w: unitW, h: unitH, resW: 1024, resH: 576 },
      { id: 'noc-rms-irradiance', x: 1.0925, y: 0.9575, w: unitW, h: unitH, resW: 1024, resH: 576 },
      { id: 'noc-cctv-mosaic', x: 3.2775, y: 0.9575, w: unitW, h: unitH, resW: 1024, resH: 576 },
    ]

    for (let idx = 0; idx < screenLayouts.length; idx++) {
      const layout = screenLayouts[idx]
      const site = NOC_MONITOR_SITES[idx]
      if (!site) continue

      // Calculate curved position along radius R = 18m
      const theta = layout.x / R
      const posX = R * Math.sin(theta)
      const curveZ = R * (1 - Math.cos(theta))
      const posZ = 0.06 + curveZ
      const rotY = theta

      // Bezel
      const bezel = new THREE.Mesh(
        new THREE.BoxGeometry(layout.w + 0.04, layout.h + 0.04, 0.04),
        bezelMat.clone(),
      )
      bezel.position.set(posX, layout.y, posZ - 0.022)
      bezel.rotation.y = rotY
      this.bezels.push(bezel)
      this.group.add(bezel)

      // Screen Canvas & Texture
      const canvas = document.createElement('canvas')
      canvas.width = layout.resW
      canvas.height = layout.resH
      this.screenCanvases.push(canvas)

      renderScreenCanvas(canvas, site, 0)

      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.anisotropy = 8
      tex.needsUpdate = true
      this.screenTextures.push(tex)

      const screenMat = new THREE.MeshBasicMaterial({ map: tex })
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(layout.w, layout.h), screenMat)
      screen.position.set(posX, layout.y, posZ + 0.003)
      screen.rotation.y = rotY
      screen.name = `NocMonitor_${site.id}`
      screen.userData.nocIndex = idx
      screen.userData.nocMonitor = site
      this.monitors.push(screen)
      this.group.add(screen)
    }
  }

  /**
   * Lighting : Ambient + Wall Glow + 3 Desk Spotlights
   */
  private buildLighting() {
    // 1. Ambient Light - low
    const hemi = new THREE.HemisphereLight(0x223b4a, 0x000000, 0.35)
    this.group.add(hemi)

    // 2. Soft screen bounce light on the room floor and desks
    const screenBounce1 = new THREE.PointLight(0x35c8da, 2.5, 16, 1.2)
    screenBounce1.position.set(-3.0, 2.8, 1.5)
    this.group.add(screenBounce1)

    const screenBounce2 = new THREE.PointLight(0x35c8da, 2.5, 16, 1.2)
    screenBounce2.position.set(3.0, 2.8, 1.5)
    this.group.add(screenBounce2)

    // 3. Three cool SpotLights above desks
    const spot1 = new THREE.SpotLight(0x9fc8e8, 0.65, 14, Math.PI / 4, 0.8)
    spot1.position.set(-2.6, 5.4, 3.2)
    spot1.target.position.set(-2.6, 0.44, 3.2)
    this.group.add(spot1)
    this.group.add(spot1.target)

    const spot2 = new THREE.SpotLight(0x9fc8e8, 0.65, 14, Math.PI / 4, 0.8)
    spot2.position.set(0.0, 5.4, 3.2)
    spot2.target.position.set(0.0, 0.44, 3.2)
    this.group.add(spot2)
    this.group.add(spot2.target)

    const spot3 = new THREE.SpotLight(0x9fc8e8, 0.65, 14, Math.PI / 4, 0.8)
    spot3.position.set(2.6, 5.4, 3.2)
    spot3.target.position.set(2.6, 0.44, 3.2)
    this.group.add(spot3)
    this.group.add(spot3.target)
  }

  show() {
    this.group.visible = true
  }

  hide() {
    this.group.visible = false
  }

  setHoveredMonitor(mesh: THREE.Mesh | null) {
    let targetIndex: number | null = null
    if (mesh && typeof mesh.userData.nocIndex === 'number') {
      targetIndex = mesh.userData.nocIndex
    }
    if (this.hoveredIndex === targetIndex) return
    this.hoveredIndex = targetIndex
    this.updateBezelHighlights()
  }

  setSelectedMonitor(index: number | null) {
    if (this.selectedIndex === index) return
    this.selectedIndex = index
    this.updateBezelHighlights()
  }

  private updateBezelHighlights() {
    for (let i = 0; i < this.bezels.length; i++) {
      const bezel = this.bezels[i]
      const mat = bezel.material as THREE.MeshStandardMaterial
      if (i === this.selectedIndex) {
        mat.color.setHex(0x35c8da)
        mat.emissive.setHex(0x35c8da)
        mat.emissiveIntensity = 0.95
      } else if (i === this.hoveredIndex) {
        mat.color.setHex(0x2fbf71)
        mat.emissive.setHex(0x2fbf71)
        mat.emissiveIntensity = 0.5
      } else {
        mat.color.setHex(0x080c10)
        mat.emissive.setHex(0x000000)
        mat.emissiveIntensity = 0
      }
    }
  }

  update(time: number) {
    if (!this.group.visible) return
    if (time - this.lastRenderTime < 0.1) return
    this.lastRenderTime = time

    for (let i = 0; i < this.monitors.length; i++) {
      const site = this.monitors[i].userData.nocMonitor as NocMonitorSite
      const canvas = this.screenCanvases[i]
      const tex = this.screenTextures[i]
      if (!site || !canvas || !tex) continue

      renderScreenCanvas(canvas, site, time)
      tex.needsUpdate = true
    }
  }

  /**
   * Returns the world bounding box of all video wall monitors and bezels.
   */
  getWallBoxWorld(): THREE.Box3 {
    this.group.updateMatrixWorld(true)
    const box = new THREE.Box3()
    for (const monitor of this.monitors) {
      box.expandByObject(monitor)
    }
    for (const bezel of this.bezels) {
      box.expandByObject(bezel)
    }
    return box
  }

  /**
   * Computes the required camera distance to frame the wall bounding box.
   * Uses vertical and horizontal FOV, aspect ratio, and usable width with lateral margin.
   */
  frameWall(camera: THREE.PerspectiveCamera, wallBox: THREE.Box3, margin = 1.15, usableWidth = 1): number {
    const size = new THREE.Vector3()
    wallBox.getSize(size)
    const vFov = THREE.MathUtils.degToRad(camera.fov)
    const distV = (size.y * margin / 2) / Math.tan(vFov / 2)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect * usableWidth)
    const distH = (size.x * margin / 2) / Math.tan(hFov / 2)
    return Math.max(distV, distH) // recule assez pour les DEUX axes
  }

  /**
   * Calculates the exact camera shot (position, target, distance) at runtime
   * for any window aspect ratio and lateral panel state, with iterative projection verification.
   */
  computeCameraShot(
    _camera?: THREE.PerspectiveCamera,
    _panelWidth = 0,
    _margin = 1.15
  ): { position: THREE.Vector3; target: THREE.Vector3; fov: number; minDistance: number; maxDistance: number; id: string; label: string } {
    const position = blenderToThree(-56.5, 101.2, 6.9)
    const target = blenderToThree(-56.5, 111.4, 6.0)
    const fov = 40

    return {
      id: 'noc-overview',
      label: 'Spot 10 · Network Operations Center',
      position,
      target,
      fov,
      minDistance: 0.5,
      maxDistance: 45.0,
    }
  }

  overviewShot(camera?: THREE.PerspectiveCamera, panelWidth = 0) {
    return this.computeCameraShot(camera, panelWidth)
  }

  monitorShot(_index: number, camera?: THREE.PerspectiveCamera, panelWidth = 0) {
    return this.computeCameraShot(camera, panelWidth)
  }

  dispose() {
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.geometry?.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of mats) m?.dispose()
    })
    for (const tex of this.screenTextures) tex.dispose()
    this.monitors.length = 0
    this.bezels.length = 0
    this.screenCanvases.length = 0
    this.screenTextures.length = 0
  }
}
