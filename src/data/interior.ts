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
    title: 'Salle technique',
    summary:
      'Vue intérieure du data center déjà présent dans le modèle : confinement, énergie, climatisation, détection et câblage. Le toit est ouvert le temps de la visite.',
    points: [
      'Lots DCF conservés dans le modèle courant',
      'Toiture coupée localement, sans autre bâtiment',
      'Chaque étape ne s’affiche que si son équipement est chargé',
    ],
  },
  {
    id: 'racks',
    title: 'Baies et confinement',
    summary:
      'Urbanisation des baies et confinement d’allée froide. L’air froid est canalisé vers les serveurs pour tenir le PUE cible.',
    points: ['Rangs de baies et confinement', 'Flux d’air froid / chaud séparés', 'PDU et connectivité entre les rangées'],
    match: /confinement_d_allee|serveurs_stockage/i,
  },
  {
    id: 'cooling',
    title: 'Climatisation de précision',
    summary:
      'Production de froid dédiée à l’IT : unités de précision, régulation de température et d’humidité, redondance N+1.',
    points: ['Froid de précision et free-cooling', 'Régulation température / hygrométrie', 'Secours climatique N+1'],
    match: /climatisation_de_precision/i,
  },
  {
    id: 'fire',
    title: 'Détection et extinction',
    summary:
      'Détection précoce et extinction propre : VESDA, Novec 1230 ou brouillard d’eau, raccordés à la supervision.',
    points: ['Détection aspirante', 'Extinction sans résidu conducteur', 'Report des alarmes vers le NOC'],
    match: /detection_extinction/i,
  },
  {
    id: 'ups',
    title: 'Onduleurs',
    summary:
      'UPS double conversion en N+1. Ils tiennent la charge IT le temps que le groupe reprenne le réseau.',
    points: ['Double conversion', 'Autonomie batteries', 'Redondance N+1'],
    match: /onduleur_ups/i,
  },
  {
    id: 'tgbt',
    title: 'TGBT',
    summary:
      'Tableau général basse tension : arrivées normale et ondulée, départs sélectifs vers les salles et les climatisations.',
    points: ['Voies normale et secourue', 'Sélectivité des départs', 'Couplage groupe / ATS'],
    match: /distribution_electrique_tgbt/i,
  },
  {
    id: 'floor',
    title: 'Faux-plancher',
    summary:
      'Plénum technique sous les baies : cheminement électrique, air soufflé et accès maintenance.',
    points: ['Dalles techniques', 'Chemin de câbles', 'Soufflage en allée froide'],
    match: /faux_plancher/i,
  },
  {
    id: 'network',
    title: 'Réseau de salle',
    summary:
      'Cœur de réseau du data center : cuivre, fibre préconnectorisée et distribution vers les baies.',
    points: ['Fibre et cuivre structurés', 'Distribution vers les baies', 'Cheminement séparé énergie / données'],
    match: /reseau_datacenter/i,
  },
  {
    id: 'supervision',
    title: 'Supervision de salle',
    summary:
      'Poste GTC / DCIM de la salle : énergie, froid, incendie et contrôle d’accès sur les mêmes écrans.',
    points: ['Alarmes énergie et froid', 'Hypervision DCIM', 'Remontée vers le NOC'],
    match: /noc_gtc_supervision/i,
  },
  {
    id: 'cctv',
    title: 'Vidéosurveillance',
    summary: 'Caméras d’allées et de sas, jour/nuit, journalisées avec le contrôle d’accès.',
    points: ['Allées froides et chaudes', 'Sas et portes techniques', 'Flux vers le poste de sécurité'],
    match: /video_surveillance/i,
  },
  {
    id: 'fitout',
    title: 'Aménagement',
    summary: 'Second œuvre de la salle : cloisonnements, huisseries et circulations techniques.',
    points: ['Cloisons et huisseries', 'Circulations', 'Finitions de salle blanche'],
    match: /amenagement_interieur|frames_inside|lestniza/i,
  },
]
