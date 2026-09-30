import { applyActivityDetails } from './activityDetails'

export type BrandId = 'solar' | 'telecom' | 'data'

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
}

export const BRANDS: Brand[] = [
  {
    id: 'solar',
    name: 'NETIS Solar',
    tagline: 'Produire, stocker, éclairer',
    color: '#f5b942',
  },
  {
    id: 'telecom',
    name: 'NETIS Telecom',
    tagline: 'Site, radio et fibre',
    color: '#3ec6ff',
  },
  {
    id: 'data',
    name: 'NETIS Data',
    tagline: 'Data center et supervision',
    color: '#7c8cff',
  },
]

export const ACTIVITIES: Activity[] = [
  {
    id: 'solar-field',
    brand: 'solar',
    title: 'Centrale photovoltaïque',
    kicker: 'Production · ≈ 1 MWc',
    summary:
      'Centrale au sol 997,9 kWc : 3 168 modules 315 Wc, structures fixes, onduleurs, string boxes, poste HTA et SCADA. Production attendue ≈ 1 700 MWh/an et 1 220 tCO₂/an évitées.',
    points: [
      '3 168 modules × 315 Wc = 997,9 kWc',
      'Garantie linéaire de puissance 25 ans',
      'Strings vers string boxes et onduleurs centraux',
      'EPC de bout en bout, sans sous-traitance',
    ],
    stats: [
      { value: '997,9 kWc', label: 'Puissance' },
      { value: '3 168', label: 'Modules' },
      { value: '1 700 MWh', label: '/ an' },
    ],
    icon: 'sun',
    anchor: [-123.9, 280.2, 2.2],
    cam: [-70, 220, 55],
    target: [-124, 280, 2],
  },
  {
    id: 'solar-inverter',
    brand: 'solar',
    title: 'Onduleurs et conversion',
    kicker: 'Conversion · 11 onduleurs',
    summary:
      'Conversion DC → AC des strings. 11 onduleurs industriels (Delta SOLIVIA) en rangées, 44 coffrets (string boxes + Quadro AC), supervision et détection de défaut.',
    points: [
      'Rendement DC → AC élevé, alarmes automatiques',
      'Agrégation DC, parafoudres et sectionneurs AC/DC',
      'Télémétrie au niveau string',
      'Raccordement direct au coffret Quadro AC',
    ],
    stats: [
      { value: '11', label: 'Onduleurs' },
      { value: '44', label: 'Coffrets' },
    ],
    icon: 'bolt',
    anchor: [-124.8, 276.6, 1.8],
    cam: [-90, 250, 18],
    target: [-125, 277, 1.6],
  },
  {
    id: 'solar-bess',
    brand: 'solar',
    title: 'Stockage BESS',
    kicker: 'Stockage · conteneur ISO',
    summary:
      'Stockage lithium conteneurisé : lissage, peak shaving et secours, couplé à la centrale et au TGBT. Conteneur isolé, 378 grilles de ventilation, 8 racks LiFePO4 48 V.',
    points: [
      'Enceinte ISO, compartiments racks et aérosol incendie',
      'PCS bidirectionnel et BMS',
      'Climatisation 48 V DC et suivi thermique cellules',
      'Micro-réseau solaire hybride et stabilisation réseau',
    ],
    stats: [
      { value: '48 V', label: 'Bus DC' },
      { value: '8 racks', label: 'LiFePO4' },
      { value: '14,5 h', label: 'Autonomie type' },
    ],
    icon: 'battery',
    anchor: [-157.8, 247.1, 2.4],
    cam: [-120, 220, 22],
    target: [-158, 247, 2],
  },
  {
    id: 'solar-tech',
    brand: 'solar',
    title: 'Local technique',
    kicker: 'Exploitation · 4 baies',
    summary:
      'Local de commande : TGBT AC, RTU SCADA, comptage HTA/BT et clim split de précision. Enveloppe semi-transparente, 290 éléments modélisés.',
    points: [
      'TGBT AC et distribution basse tension',
      'Passerelle SCADA / télémétrie',
      'Comptage et découplage réseau',
      'Climatisation split pour l’électronique',
    ],
    stats: [
      { value: '4', label: 'Baies' },
      { value: '290', label: 'Éléments 3D' },
    ],
    icon: 'building',
    anchor: [-142.2, 242.5, 3.2],
    cam: [-110, 220, 16],
    target: [-142, 243, 2.5],
  },
  {
    id: 'solar-delivery',
    brand: 'solar',
    title: 'Poste de livraison',
    kicker: 'Raccordement · 1 000 kVA',
    summary:
      'Poste HTA : transformateur 1 000 kVA, cellules, comptage, relais de découplage. Double alimentation centrale solaire et data center. 80 éléments.',
    points: [
      'Élévation BT → HTA 1 000 kVA',
      'Cellules HTA et comptage de découplage',
      'Double départ centrale / data center',
      'Interface commune avec le réseau',
    ],
    stats: [
      { value: '1 000 kVA', label: 'Transfo' },
      { value: '80', label: 'Éléments' },
    ],
    icon: 'grid',
    anchor: [-200.7, 226.1, 2.2],
    cam: [-175, 200, 18],
    target: [-201, 226, 2],
  },
  {
    id: 'solar-source',
    brand: 'solar',
    title: 'Poste source 60/22 kV',
    kicker: 'Réseau · 131 × 71 m',
    summary:
      'Poste source HT complet (131 × 71 m, 32 m de haut) : portiques, appareillage HT/MT, transformateurs, génie civil. 6 539 éléments.',
    points: [
      'Transformation HT et distribution MT',
      'Appareillage sur portiques galvanisés',
      'Fondations, caniveaux, clôture',
      'SCADA, protections et télémétrie NOC',
    ],
    stats: [
      { value: '131 × 71 m', label: 'Emprise' },
      { value: '32 m', label: 'Hauteur' },
      { value: '6 539', label: 'Éléments' },
    ],
    icon: 'grid',
    anchor: [334.6, 306.2, 14.2],
    cam: [420, 260, 48],
    target: [334.6, 306.2, 14.2],
  },
  {
    id: 'solar-carport',
    brand: 'solar',
    title: 'Ombrières solaires',
    kicker: 'Carport · 98 modules',
    summary:
      'Ombrières de parking et hub IRVE : 98 modules, 156 pièces de structure acier, chargeurs L2 / DC Fast, gestion dynamique de l’énergie.',
    points: [
      'Ombre et valorisation du parking',
      'Recharge L2 et DC Fast',
      'Autoconsommation et couplage réseau / BESS',
      'Structures 20 ans anti-corrosion',
    ],
    stats: [
      { value: '98', label: 'Modules' },
      { value: '156', label: 'Pièces acier' },
    ],
    icon: 'carport',
    anchor: [-65.5, 214.1, 2.4],
    cam: [-30, 185, 22],
    target: [-66, 214, 2],
  },
  {
    id: 'solar-meteo',
    brand: 'solar',
    title: 'Station météo & irradiance',
    kicker: 'Mesure · PR temps réel',
    summary:
      'Station de référence : pyranomètres classe A, cellule PV de référence, sondes module / ambiance, anémomètre. Calcule le Performance Ratio en direct.',
    points: [
      'Pyranomètres classe A et cellule de référence',
      'Sondes température module et ambiante',
      'Anémomètre ultrasonique et girouette',
      'Atlas GHI jusqu’à 1 200 W/m²',
    ],
    stats: [
      { value: 'Classe A', label: 'Pyranomètres' },
      { value: '1 040 W/m²', label: 'GHI type' },
    ],
    icon: 'sun',
    anchor: [-200.0, 280.9, 2.0],
    cam: [-208, 272, 5.5],
    target: [-200, 280.9, 2],
  },
  {
    id: 'solar-light',
    brand: 'solar',
    title: 'Éclairage public solaire',
    kicker: 'Ville · autonomie nocturne',
    summary:
      'Candélabres autonomes : PV intégré, batterie, horloge astronomique et cellule photo. Pas de tirage réseau.',
    points: [
      'Tête PV et batterie embarquée',
      'Luminaires LED voirie',
      'Commande horloge / photocellule',
      'Autonomie nocturne sans raccordement',
    ],
    stats: [{ value: 'LED', label: 'Voirie' }, { value: '0 kWh', label: 'Réseau' }],
    icon: 'lamp',
    anchor: [-14.7, 216.5, 4.2],
    cam: [20, 170, 16],
    target: [-15, 216, 3],
  },
  {
    id: 'tel-tower',
    brand: 'telecom',
    title: 'Site et pylône',
    kicker: 'Mobile · 41 m',
    summary:
      'Pylône treillis autostable 41 m : calculs de vent, massifs béton, assemblage et audits. 437 éléments. Antennes sectorielles, faisceaux et balisage OACI.',
    points: [
      'Pylône autostable 41 m, 437 éléments',
      'Massifs béton et études de sol',
      'Antennes tri-bande et liaisons MW',
      'Balisage LED OACI + télémétrie NOC',
    ],
    stats: [
      { value: '41 m', label: 'Hauteur' },
      { value: '437', label: 'Éléments' },
      { value: '6', label: 'Antennes type' },
    ],
    icon: 'tower',
    anchor: [-89.8, 121.9, 26],
    cam: [-40, 70, 28],
    target: [-90, 122, 18],
  },
  {
    id: 'tel-cabinets',
    brand: 'telecom',
    title: 'Armoires outdoor',
    kicker: 'Énergie de site · 48 V',
    summary:
      'Armoires et shelters : baie 48 V, redresseurs, lithium ou VRLA, clim 48 V DC. 14 armoires. Groupe de secours hybride solaire.',
    points: [
      'Redresseurs 48 V et distribution',
      'Batteries lithium / VRLA',
      'Climatisation armoire 48 V DC',
      'Hybride solaire + groupe, télémétrie carburant',
    ],
    stats: [
      { value: '48 V', label: 'Bus DC' },
      { value: '14', label: 'Armoires' },
    ],
    icon: 'cabinet',
    anchor: [-72.4, 127.0, 2.8],
    cam: [-50, 100, 12],
    target: [-72, 127, 2],
  },
  {
    id: 'tel-fiber-air',
    brand: 'telecom',
    title: 'Fibre aérienne',
    kicker: 'Fibre · 220 m ADSS',
    summary:
      'Câble ADSS sur 220 m de voirie, dérivations sur appuis partagés BT/télécom, pinces, ferrures et boucles de maintenance.',
    points: [
      'Câble diélectrique autoporté ADSS',
      'Appuis partagés BT / télécom',
      'Dérivations et boucles de slack',
      'Soudure, tests et certification OTDR',
    ],
    stats: [
      { value: '220 m', label: 'Portée rue' },
      { value: '34', label: 'Éléments' },
    ],
    icon: 'fiber',
    anchor: [20.6, 209.1, 5.4],
    cam: [55, 160, 18],
    target: [21, 209, 5],
  },
  {
    id: 'tel-fiber-ug',
    brand: 'telecom',
    title: 'Fibre souterraine',
    kicker: 'OSP · chambres & BPE',
    summary:
      'Chambres béton, cadres fonte, BPE dôme (FIST / FOSC), fourreaux PEHD orange en tranchée partagée. Tranchée HTA type 3×1×150 mm² XLPE.',
    points: [
      'Chambres, tampons fonte et BPE dôme',
      'Câbles entrants et boucles organisées',
      'Fourreaux PEHD / microducts',
      'Lit de sable, grillage rouge, regards',
    ],
    stats: [
      { value: '23', label: 'Objets FO' },
      { value: '150 mm²', label: 'Câble HTA type' },
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
    kicker: 'Répartition optique',
    summary:
      'Sous-répartiteur de rue : enveloppe étanche, portes, étiquetage, socle, grilles et arrivées feeder. Brassage, coupleurs, traçabilité des ports.',
    points: [
      'Brassage et coupleurs FTTx',
      'Étiquetage et traçabilité des ports',
      'Interface fourreaux feeder',
      '7 éléments de cabinet modélisés',
    ],
    stats: [{ value: 'SRO', label: 'Rue' }, { value: '7', label: 'Éléments' }],
    icon: 'node',
    anchor: [55.1, 300.5, 1.6],
    cam: [80, 275, 12],
    target: [55, 301, 1.2],
  },
  {
    id: 'tel-guard',
    brand: 'telecom',
    title: 'Sécurité de site',
    kicker: 'Périmètre · 175 × 100 m',
    summary:
      'Clôture 175 × 100 m (72 éléments), portail motorisé, 10 mâts caméra à 7,4 m, CCTV 360° vers le NOC, poste de garde et contrôle d’accès.',
    points: [
      'Clôture anti-escalade et fil concertina',
      '10 mâts, hauteur optique 7,4 m',
      'Caméras jour/nuit IR, flux NOC 24/7',
      'Contrôle d’accès et journalisation',
    ],
    stats: [
      { value: '175 × 100 m', label: 'Clôture' },
      { value: '10', label: 'Mâts CCTV' },
      { value: '7,4 m', label: 'Hauteur optique' },
    ],
    icon: 'shield',
    anchor: [-90, 131, 4],
    cam: [-50, 95, 16],
    target: [-90, 132, 3],
  },
  {
    id: 'data-shell',
    brand: 'data',
    title: 'Data center',
    kicker: 'Bâtiment · 10 lots DCF',
    summary:
      'Enveloppe et salle technique : fondations, dalle lourde, percements, étanchéité. Lots DCF-00 à DCF-09 : confinement, clim, incendie, énergie, faux-plancher.',
    points: [
      'Ingénierie clé en main jusqu’à la recette',
      'Urbanisation racks et confinement d’allée froide',
      'Clim de précision, free-cooling, In-Row',
      'Continuité : transfo, groupe, UPS, TGBT',
    ],
    stats: [
      { value: '10 lots', label: 'DCF-00 → 09' },
      { value: 'Tier III', label: 'Cible' },
      { value: 'PUE 1,32', label: 'NOC' },
    ],
    icon: 'datacenter',
    anchor: [-147.8, 202.4, 8],
    cam: [-80, 155, 28],
    target: [-148, 202, 7],
  },
  {
    id: 'data-power',
    brand: 'data',
    title: 'Énergie critique',
    kicker: 'Alimentation · 10–4 000 kVA',
    summary:
      'Groupe de secours (démarrage AMF, ATS), UPS double conversion N+1, TGBT type OKKEN, départs normal / ondulé. Groupes NETIS de 10 à 4 000 kVA.',
    points: [
      'Démarrage automatique sur perte réseau',
      'Couplage ATS / TGBT',
      'UPS N+1 et autonomie batteries',
      'Protection sélective et départs 2N',
    ],
    stats: [
      { value: '10–4 000 kVA', label: 'Groupes' },
      { value: 'N+1', label: 'UPS' },
      { value: '482 kW', label: 'Charge IT type' },
    ],
    icon: 'bolt',
    anchor: [-136.9, 200.3, 3],
    cam: [-95, 165, 16],
    target: [-137, 200, 3],
  },
  {
    id: 'data-it',
    brand: 'data',
    title: 'Infrastructure IT',
    kicker: 'Salle · 64 baies type',
    summary:
      'Baies haute densité, SAN/NAS, virtualisation, fabric Spine/Leaf, cuivre Cat.6A et fibre préconnectorisée MTP. Réf. BCP Berrechid : 170+ racks, 340+ PDU.',
    points: [
      'Serveurs rack et hyperconvergence',
      'Stockage SAN/NAS et réplication',
      'Spine/Leaf, SDN et SD-WAN',
      'Câblage MTP + Cat.6A',
    ],
    stats: [
      { value: '64', label: 'Baies 42U type' },
      { value: '20 000+', label: 'Ports réseau' },
    ],
    icon: 'server',
    anchor: [-155, 203, 3],
    cam: [-110, 170, 14],
    target: [-155, 203, 2.5],
  },
  {
    id: 'data-noc',
    brand: 'data',
    title: 'Salle NOC',
    kicker: 'Supervision · 13 écrans',
    summary:
      'Centre d’exploitation 24/7 : alarmes, énergie, sites et interventions. Mur de 13 écrans (maître 2×2 + 12 consoles). 19 pays, 15 000 sites, 7 000 km de fibre.',
    points: [
      'Hypervision 19 pays · SLA 99,98 %',
      'Dispatch 12 équipes 4×4, MTTR 18 min',
      'SCADA solaire, BESS 48 V, hybride −40 % diesel',
      'SOC cyber, CCTV 2×2, GMAO',
    ],
    stats: [
      { value: '13', label: 'Écrans' },
      { value: '19', label: 'Pays' },
      { value: '15 000', label: 'Sites' },
      { value: '7 000 km', label: 'Fibre' },
    ],
    nocRoom: true,
    icon: 'noc',
    anchor: [-169.6, 129.4, 18],
    cam: [-120, 80, 32],
    target: [-170, 135, 16],
  },
  {
    id: 'data-security',
    brand: 'data',
    title: 'Sécurité',
    kicker: 'Protection · VESDA / Novec',
    summary:
      'CCTV salle, biométrie, anti-passback, VESDA, extinction Novec 1230 / brouillard d’eau, 180+ caméras de référence (Nador + Al Hoceima).',
    points: [
      'Contrôle d’accès biométrique multi-niveaux',
      'CCTV allées froides / chaudes',
      'Détection aspirante et Novec 1230',
      'Intégration alarmes NOC / GTC',
    ],
    stats: [
      { value: '180+', label: 'Caméras réf.' },
      { value: '4 zones', label: 'Novec' },
    ],
    icon: 'shield',
    anchor: [-160, 201, 4],
    cam: [-105, 165, 16],
    target: [-160, 201, 3],
  },
]

export function activitiesOf(brand: BrandId) {
  return ACTIVITIES.filter((item) => item.brand === brand)
}

export function brandById(id: BrandId) {
  return BRANDS.find((brand) => brand.id === id)!
}

export function placeById(activity: Activity, placeId: string | null | undefined) {
  if (!placeId) return undefined
  return activity.places?.find((place) => place.id === placeId)
}

applyActivityDetails(ACTIVITIES)
