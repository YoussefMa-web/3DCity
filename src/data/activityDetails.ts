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
      benefits: ['Énergie produite sur site', 'Environ 1 220 tCO₂ évitées par an', 'Contrat EPC sans découpage de lots'],
      places: [
        place(sourceOf('solar-field'), 'modules', 'Modules photovoltaïques', '3 168 modules de 315 Wc, soit 997,9 kWc, avec garantie linéaire de puissance sur 25 ans.', ['315 Wc par module', 'Garantie de puissance 25 ans', 'Strings regroupés vers les coffrets'], 0.42, -18, 4, 32),
        place(sourceOf('solar-field'), 'structures', 'Structures et rangées', 'Tables fixes, ancrages et alignement des rangées. La géométrie sert le rendement et la maintenance.', ['Structures fixes anti-corrosion', 'Allées de maintenance', 'Tenue au vent du site'], 0.28, 22, 8, 38),
      ],
    },
    'solar-inverter': {
      fov: 36,
      minDistance: 4,
      maxDistance: 80,
      flowKind: 'power',
      benefits: ['Conversion DC/AC surveillée', 'Défaut isolé au niveau du string'],
      places: [
        place(sourceOf('solar-inverter'), 'inverters', 'Onduleurs', 'Onze onduleurs industriels convertissent les strings. Alarmes et rendement sont remontés en supervision.', ['11 onduleurs', 'Alarmes automatiques', 'Rendement DC vers AC'], 0.45, -6, 1, 30, undefined, 'power'),
        place(sourceOf('solar-inverter'), 'strings', 'Coffrets de chaînes', 'Quarante-quatre coffrets : string boxes et Quadro AC, parafoudres et sectionneurs.', ['44 coffrets', 'Parafoudres AC/DC', 'Départ vers le Quadro AC'], 0.5, 8, 0.5, 28, undefined, 'power'),
      ],
    },
    'solar-bess': {
      fov: 38,
      minDistance: 4,
      maxDistance: 90,
      benefits: ['Écrêtage et secours', 'Lissage de la centrale'],
      places: [
        place(sourceOf('solar-bess'), 'racks', 'Racks lithium', 'Conteneur ISO et huit racks LiFePO4 48 V. Le BMS suit chaque chaîne.', ['8 racks 48 V', 'BMS et PCS bidirectionnel', 'Autonomie type 14,5 h'], 0.4, -5, 1),
        place(sourceOf('solar-bess'), 'thermal', 'Thermique et incendie', 'Grilles de ventilation, climatisation 48 V et compartiment aérosol. La température des cellules reste dans la plage.', ['378 grilles de ventilation', 'Climatisation 48 V DC', 'Protection incendie du conteneur'], 0.48, 6, 0.4, 30),
      ],
    },
    'solar-tech': {
      fov: 34,
      minDistance: 3,
      maxDistance: 70,
      benefits: ['Un seul local pour compter, protéger et superviser'],
      places: [
        place(sourceOf('solar-tech'), 'tgbt', 'TGBT solaire', 'Distribution basse tension de la centrale et interface avec le poste de livraison.', ['TGBT AC', 'Protection des départs', 'Découplage réseau'], 0.4, -4, 0.6, 30),
        place(sourceOf('solar-tech'), 'scada', 'SCADA et comptage', 'RTU, comptage HTA/BT et climatisation de l’électronique de commande.', ['Passerelle SCADA', 'Comptage HTA/BT', '4 baies de commande'], 0.46, 5, 0.4, 28),
      ],
    },
    'solar-delivery': {
      fov: 36,
      minDistance: 4,
      maxDistance: 90,
      flowKind: 'power',
      benefits: ['Un poste commun à la centrale et au data center'],
      places: [
        place(sourceOf('solar-delivery'), 'transformer', 'Transformateur 1 000 kVA', 'Élévation BT vers HTA. Le poste raccorde la centrale et le data center.', ['1 000 kVA', 'Double départ', '80 éléments modélisés'], 0.38, -6, 1, 32, undefined, 'power'),
        place(sourceOf('solar-delivery'), 'cells', 'Cellules et comptage', 'Cellules HTA, comptage de découplage et protection du point de livraison.', ['Cellules HTA', 'Relais de découplage', 'Interface réseau'], 0.46, 7, 0.5, 30, undefined, 'power'),
      ],
    },
    'solar-source': {
      fov: 46,
      minDistance: 12,
      maxDistance: 260,
      flowKind: 'power',
      benefits: ['Injection et distribution HT/MT sur un même poste'],
      places: [
        place(sourceOf('solar-source'), 'gantry', 'Portiques', 'Charpente galvanisée, 131 × 71 m, hauteur 32 m. L’appareillage HT/MT est porté par les portiques.', ['131 × 71 m', 'Hauteur 32 m', '6 539 éléments'], 0.22, -30, 6, 40, undefined, 'power'),
        place(sourceOf('solar-source'), 'transformers', 'Transformateurs', 'Transformation 60/22 kV, cuvettes et accès lourds pour la maintenance.', ['60/22 kV', 'Cuvettes de rétention', 'Accès convois'], 0.34, 24, 2, 36, undefined, 'power'),
        place(sourceOf('solar-source'), 'protection', 'Protections', 'Relais, signalisation de cellule et télémétrie remontée au NOC.', ['Protections sélectives', 'Signalisation', 'SCADA poste'], 0.4, 10, 4, 34, undefined, 'power'),
      ],
    },
    'solar-carport': {
      fov: 38,
      minDistance: 4,
      maxDistance: 80,
      benefits: ['Le parking produit et recharge'],
      places: [
        place(sourceOf('solar-carport'), 'canopy', 'Ombrières', '98 modules sur 156 pièces d’acier. L’ombre du parking devient une surface de production.', ['98 modules', '156 pièces d’acier', 'Structures 20 ans'], 0.36, -8, 2, 32),
        place(sourceOf('solar-carport'), 'ev', 'Recharge véhicules', 'Bornes L2 et DC Fast, gestion dynamique avec le réseau et le stockage.', ['L2 et DC Fast', 'Pilotage de la charge', 'Couplage BESS'], 0.48, 8, 1, 30),
      ],
    },
    'solar-meteo': {
      fov: 32,
      minDistance: 3,
      maxDistance: 40,
      benefits: ['Le Performance Ratio se calcule sur une mesure de référence'],
      places: [
        place(sourceOf('solar-meteo'), 'irradiance', 'Irradiance', 'Pyranomètres classe A et cellule PV de référence. L’atlas de site monte jusqu’à 1 200 W/m².', ['Classe A', 'Cellule de référence', 'GHI type 1 040 W/m²'], 0.35, -3, 0.4, 28),
        place(sourceOf('solar-meteo'), 'weather', 'Météo de site', 'Température module et ambiante, anémomètre et girouette pour expliquer les écarts de production.', ['Sondes module / air', 'Vent', 'Entrée du calcul de PR'], 0.42, 4, 0.2, 26),
      ],
    },
    'solar-light': {
      fov: 36,
      minDistance: 3,
      maxDistance: 60,
      benefits: ['Éclairage de voirie sans tirage réseau'],
      places: [
        place(sourceOf('solar-light'), 'day', 'Jour — charge', 'Le module charge la batterie. Le luminaire reste en veille.', ['PV en charge', 'Batterie pleine', 'Luminaire à 0 %'], 0.3, -4, 1, 32),
        place(sourceOf('solar-light'), 'night', 'Nuit — plein feu', 'Horloge astronomique ou cellule : le candélabre passe à 100 % sans réseau.', ['0 W solaire', 'LED à 100 %', 'Autonomie de la batterie'], 0.4, 0, 2, 30),
        place(sourceOf('solar-light'), 'eco', 'Nuit — mode éco', 'Gradation autour de 30 %, avec détection de présence si le luminaire le permet.', ['LED à 30 %', 'Détection', 'Autonomie allongée'], 0.46, 5, 1, 28),
      ],
    },
    'tel-tower': {
      fov: 40,
      minDistance: 8,
      maxDistance: 160,
      benefits: ['Un site calculé, monté et supervisé par le même partenaire'],
      places: [
        place(sourceOf('tel-tower'), 'mast', 'Pylône 41 m', 'Treillis autostable, massifs béton et 437 éléments. Le calcul de vent précède le montage.', ['41 m', '437 éléments', 'Massifs et étude de sol'], 0.25, -12, 6, 36),
        place(sourceOf('tel-tower'), 'radio', 'Antennes et faisceaux', 'Antennes sectorielles et liaisons hertziennes. Le plan de fréquences tient sur la même structure.', ['Antennes tri-bande', 'Faisceaux', 'Lignes d’alimentation'], 0.4, 8, -2, 32),
        place(sourceOf('tel-tower'), 'obstruction', 'Balisage', 'Feux LED aux normes OACI, avec télémétrie de défaut vers le NOC.', ['Balisage OACI', 'Contrôle du feu', 'Alarme NOC'], 0.15, 0, 18, 28),
      ],
    },
    'tel-cabinets': {
      fov: 34,
      minDistance: 3,
      maxDistance: 70,
      benefits: ['Le site radio tient sur un bus 48 V secouru'],
      places: [
        place(sourceOf('tel-cabinets'), 'rectifiers', 'Redresseurs 48 V', 'Quatorze armoires outdoor : redressement, distribution et climatisation en 48 V.', ['Bus 48 V', '14 armoires', 'Distribution site'], 0.4, -5, 0.6, 30),
        place(sourceOf('tel-cabinets'), 'batteries', 'Batteries', 'Lithium ou VRLA selon le site, testées en maintenance préventive.', ['Lithium ou VRLA', 'Autonomie radio', 'Test de banc'], 0.5, 5, 0.3, 28),
      ],
    },
    'tel-fiber-air': {
      fov: 40,
      minDistance: 6,
      maxDistance: 140,
      flowKind: 'fiber',
      benefits: ['La rue porte le câble sans génie civil lourd'],
      places: [
        place(sourceOf('tel-fiber-air'), 'adss', 'Câble ADSS', 'Portée aérienne d’environ 220 m, câble diélectrique autoporté.', ['220 m de voirie', '34 éléments', 'Boucles de mou'], 0.3, -10, 3, 36, undefined, 'fiber'),
        place(sourceOf('tel-fiber-air'), 'poles', 'Appuis partagés', 'Ancrages sur appuis BT et télécom, pinces et dérivations.', ['Appuis partagés', 'Ferrures', 'Recette OTDR'], 0.45, 12, 1, 32, undefined, 'fiber'),
      ],
    },
    'tel-fiber-ug': {
      fov: 36,
      minDistance: 4,
      maxDistance: 80,
      flowKind: 'fiber',
      benefits: ['Le réseau optique reste accessible et identifiable'],
      places: [
        place(sourceOf('tel-fiber-ug'), 'chamber', 'Chambres et BPE', 'Chambres béton, tampons fonte et boîtiers d’épissurage. Les loveurs restent ordonnés.', ['23 objets fibre', 'BPE dôme', 'Accès maintenance'], 0.4, -4, 1, 30, undefined, 'fiber'),
        place(sourceOf('tel-fiber-ug'), 'ducts', 'Fourreaux', 'PEHD orange en tranchée partagée, avec grillage avertisseur.', ['Fourreaux PEHD', 'Tranchée partagée', 'Repérage'], 0.5, 6, 0.4, 32, undefined, 'fiber'),
      ],
    },
    'tel-sro': {
      fov: 32,
      minDistance: 3,
      maxDistance: 50,
      flowKind: 'fiber',
      benefits: ['Chaque port de rue est traçable'],
      places: [
        place(sourceOf('tel-sro'), 'patch', 'Brassage', 'Sous-répartiteur étanche : portes, socle, étiquetage et arrivées feeder.', ['Brassage FTTx', 'Étiquetage des ports', '7 éléments'], 0.42, -3, 0.4, 28, undefined, 'fiber'),
        place(sourceOf('tel-sro'), 'splitters', 'Coupleurs', 'Coupleurs et continuité vers les fourreaux de distribution.', ['Coupleurs', 'Continuité feeder', 'Recette optique'], 0.5, 4, 0.2, 26, undefined, 'fiber'),
      ],
    },
    'tel-guard': {
      fov: 38,
      minDistance: 5,
      maxDistance: 120,
      benefits: ['Le périmètre et la vidéo arrivent au même NOC'],
      places: [
        place(sourceOf('tel-guard'), 'fence', 'Clôture', 'Périmètre 175 × 100 m, 72 éléments, portail motorisé.', ['175 × 100 m', 'Anti-escalade', 'Portail'], 0.28, -14, 2, 36),
        place(sourceOf('tel-guard'), 'cctv', 'Mâts caméra', 'Dix mâts, optique à 7,4 m, vision jour/nuit vers le NOC.', ['10 mâts', '7,4 m', 'Flux 24/7'], 0.4, 8, 3, 32),
      ],
    },
    'data-shell': {
      fov: 40,
      minDistance: 6,
      maxDistance: 140,
      enterInterior: true,
      benefits: ['Du génie civil à la recette, un seul lot technique'],
      places: [
        place(sourceOf('data-shell'), 'shell', 'Enveloppe', 'Fondations, dalle lourde, percements et étanchéité. Dix lots DCF structurent la salle.', ['DCF-00 à DCF-09', 'Cible Tier III', 'PUE 1,32 suivi au NOC'], 0.22, -16, 4, 38),
        place(sourceOf('data-shell'), 'hall', 'Salle', 'La visite intérieure ouvre le volume déjà modélisé : baies, froid, énergie et sécurité.', ['Entrer pour la coupe', 'Équipements présents uniquement', 'Pas de second modèle'], 0.4, 10, 6, 34),
      ],
    },
    'data-power': {
      fov: 34,
      minDistance: 4,
      maxDistance: 80,
      enterInterior: true,
      flowKind: 'power',
      benefits: ['La charge IT ne voit pas la coupure réseau'],
      places: [
        place(sourceOf('data-power'), 'genset', 'Groupe', 'Groupes de 10 à 4 000 kVA, démarrage automatique et ATS.', ['10–4 000 kVA', 'Démarrage AMF', 'Couplage ATS'], 0.35, -6, 1, 32, undefined, 'power'),
        place(sourceOf('data-power'), 'continuity', 'UPS et TGBT', 'Double conversion N+1 et tableau général. La charge type suivie est de 482 kW.', ['UPS N+1', 'TGBT', '482 kW IT type'], 0.48, 6, 0.8, 30, undefined, 'power'),
      ],
    },
    'data-it': {
      fov: 34,
      minDistance: 4,
      maxDistance: 70,
      enterInterior: true,
      benefits: ['La salle type tient 64 baies, la référence client dépasse 170 racks'],
      places: [
        place(sourceOf('data-it'), 'racks', 'Baies', 'Soixante-quatre baies 42U dans la salle type. La référence BCP Berrechid dépasse 170 racks.', ['64 baies 42U', 'Confinement d’allée', 'PDU par baie'], 0.4, -5, 1, 30),
        place(sourceOf('data-it'), 'fabric', 'Réseau', 'Spine/Leaf, cuivre Cat.6A et fibre MTP. Plus de 20 000 ports sur le périmètre de référence.', ['Spine/Leaf', 'MTP et Cat.6A', '20 000+ ports'], 0.5, 6, 0.6, 28),
      ],
    },
    'data-noc': {
      fov: 42,
      minDistance: 8,
      maxDistance: 160,
      benefits: ['19 pays, 15 000 sites et 7 000 km de fibre sur le même mur'],
      places: [
        place(sourceOf('data-noc'), 'wall', 'Mur de 13 écrans', 'Écran maître et douze consoles : alarmes, énergie, fibre, sites et équipes.', ['13 écrans', 'SLA 99,98 %', 'Astreinte MTTR 18 min'], 0.3, -8, 2, 36),
        place(sourceOf('data-noc'), 'dispatch', 'Dispatch', 'Douze équipes terrain, GMAO et corrélation des alarmes multi-pays.', ['Équipes 4×4', 'GMAO', 'Ouvert dans l’onglet Supervision'], 0.42, 10, 1, 34),
      ],
    },
    'data-security': {
      fov: 36,
      minDistance: 4,
      maxDistance: 80,
      enterInterior: true,
      benefits: ['L’intrusion et l’incendie arrivent sur le même pupitre'],
      places: [
        place(sourceOf('data-security'), 'access', 'Accès', 'Biométrie, anti-passback et journal des portes techniques.', ['Multi-niveaux', 'Sas', 'Journal NOC'], 0.38, -5, 1, 32),
        place(sourceOf('data-security'), 'safety', 'Incendie et vidéo', 'VESDA, Novec sur 4 zones, et plus de 180 caméras sur le périmètre de référence.', ['VESDA', '4 zones Novec', '180+ caméras de référence'], 0.48, 6, 0.8, 30),
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
