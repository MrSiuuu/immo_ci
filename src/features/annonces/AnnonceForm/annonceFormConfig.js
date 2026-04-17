/**
 * Configuration du formulaire d'annonce par type de bien.
 * Clés = nom exact du type tel qu'en base (table `types_biens.nom`).
 */

/** @typedef {'boolean' | 'number' | 'select' | 'text'} EquipementUiType */

/**
 * Métadonnées UI pour les clés stockées dans `annonces.equipements` (jsonb).
 */
export const EQUIPEMENT_DEFINITIONS = {
  cloture: { label: 'Clôture', type: 'boolean' },
  acces_route: { label: 'Accès route', type: 'boolean' },
  nom_route: { label: 'Nom de la route', type: 'text' },
  sous_bassement: { label: 'Sous-bassement', type: 'boolean' },
  description_sous_bassement: { label: 'Description du sous-bassement', type: 'text' },
  titre_foncier: { label: 'Titre foncier', type: 'boolean' },
  attestation_villageoise: { label: 'Attestation villageoise', type: 'boolean' },
  acd: { label: 'ACD', type: 'boolean' },
  lotissement: { label: 'Lotissement', type: 'boolean' },
  eau: { label: 'Eau', type: 'boolean' },
  electricite: { label: 'Électricité', type: 'boolean' },
  climatisation: { label: 'Climatisation', type: 'boolean' },
  eau_chaude: { label: 'Eau chaude', type: 'boolean' },
  groupe_electrogene: { label: 'Groupe électrogène', type: 'boolean' },
  gardien: { label: 'Gardien', type: 'boolean' },
  piscine: { label: 'Piscine', type: 'boolean' },
  parking: { label: 'Parking / Garage', type: 'boolean' },
  internet: { label: 'Internet / WiFi', type: 'boolean' },
  cuisine_equipee: { label: 'Cuisine équipée', type: 'boolean' },
  terrasse: { label: 'Terrasse / Balcon', type: 'boolean' },
  ascenseur: { label: 'Ascenseur', type: 'boolean' },
  nombre_etages: { label: "Nombre d'étages", type: 'number' },
  nombre_lots: { label: 'Nombre de lots', type: 'number' },
  usage_commercial: {
    label: 'Usage commercial',
    type: 'select',
    options: [
      { value: 'bureau', label: 'Bureau' },
      { value: 'commerce', label: 'Commerce' },
      { value: 'restaurant', label: 'Restaurant' },
      { value: 'entrepot', label: 'Entrepôt' },
      { value: 'autre', label: 'Autre' },
    ],
  },
}

const RESIDENTIEL_COMPLET = [
  'climatisation',
  'eau_chaude',
  'groupe_electrogene',
  'gardien',
  'piscine',
  'parking',
  'internet',
  'cuisine_equipee',
  'terrasse',
  'ascenseur',
]

const RESIDENTIEL_SIMPLE = ['internet', 'eau_chaude', 'climatisation', 'parking']

const RESIDENTIEL_PREMIUM = [...RESIDENTIEL_COMPLET]

const IMMEUBLE_EQ = [
  'ascenseur',
  'gardien',
  'parking',
  'groupe_electrogene',
  'internet',
  'nombre_etages',
  'nombre_lots',
]

const LOCAL_COMMERCIAL_EQ = [
  'internet',
  'climatisation',
  'parking',
  'groupe_electrogene',
  'gardien',
  'usage_commercial',
]

const STUDIO_EQ = ['climatisation', 'internet', 'cuisine_equipee', 'terrasse', 'parking']

/**
 * @type {Record<string, {
 *   fields: Record<string, { visible: boolean, required: boolean, storage?: 'equipements' }>,
 *   equipements: string[],
 *   impliedValues: Record<string, number | null | undefined>,
 * }>}
 */
export const ANNONCE_FORM_CONFIG_BY_TYPE = {
  Appartement: {
    fields: {
      surface: { visible: true, required: true },
      chambres: { visible: true, required: true },
      salles_de_bain: { visible: true, required: true },
      adresse: { visible: true, required: false },
      description: { visible: true, required: false },
    },
    equipements: RESIDENTIEL_COMPLET,
    impliedValues: {},
  },

  Chambre: {
    fields: {
      surface: { visible: true, required: true },
      chambres: { visible: false, required: false },
      salles_de_bain: { visible: false, required: false },
      adresse: { visible: true, required: false },
      description: { visible: true, required: false },
    },
    equipements: RESIDENTIEL_SIMPLE,
    impliedValues: { chambres: null, salles_de_bain: null },
  },

  Duplex: {
    fields: {
      surface: { visible: true, required: true },
      chambres: { visible: true, required: true },
      salles_de_bain: { visible: true, required: true },
      adresse: { visible: true, required: false },
      description: { visible: true, required: false },
    },
    equipements: RESIDENTIEL_PREMIUM,
    impliedValues: {},
  },

  Immeuble: {
    fields: {
      surface: { visible: true, required: true },
      chambres: { visible: false, required: false },
      salles_de_bain: { visible: false, required: false },
      adresse: { visible: true, required: false },
      description: { visible: true, required: false },
      nombre_etages: { visible: true, required: true, storage: 'equipements' },
      nombre_lots: { visible: true, required: false, storage: 'equipements' },
    },
    equipements: IMMEUBLE_EQ,
    impliedValues: { chambres: null, salles_de_bain: null },
  },

  'Local commercial': {
    fields: {
      surface: { visible: true, required: true },
      chambres: { visible: false, required: false },
      salles_de_bain: { visible: false, required: false },
      adresse: { visible: true, required: false },
      description: { visible: true, required: false },
      usage_commercial: { visible: true, required: true, storage: 'equipements' },
    },
    equipements: LOCAL_COMMERCIAL_EQ,
    impliedValues: { chambres: null, salles_de_bain: null },
  },

  Studio: {
    fields: {
      surface: { visible: true, required: true },
      chambres: { visible: false, required: false },
      salles_de_bain: { visible: true, required: true },
      adresse: { visible: true, required: false },
      description: { visible: true, required: false },
    },
    equipements: STUDIO_EQ,
    impliedValues: { chambres: 1 },
  },

  Terrain: {
    fields: {
      surface: { visible: true, required: true },
      chambres: { visible: false, required: false },
      salles_de_bain: { visible: false, required: false },
      adresse: { visible: true, required: false },
      description: { visible: true, required: false },
      cloture: { visible: true, required: false, storage: 'equipements' },
      acces_route: { visible: true, required: false, storage: 'equipements' },
      nom_route: { visible: true, required: false, storage: 'equipements' },
      sous_bassement: { visible: true, required: false, storage: 'equipements' },
      description_sous_bassement: { visible: true, required: false, storage: 'equipements' },
    },
    equipements: [
      'cloture',
      'acces_route',
      'nom_route',
      'sous_bassement',
      'description_sous_bassement',
      'titre_foncier',
      'attestation_villageoise',
      'acd',
      'lotissement',
      'eau',
      'electricite',
    ],
    impliedValues: { chambres: null, salles_de_bain: null },
  },

  Villa: {
    fields: {
      surface: { visible: true, required: true },
      chambres: { visible: true, required: true },
      salles_de_bain: { visible: true, required: true },
      adresse: { visible: true, required: false },
      description: { visible: true, required: false },
    },
    equipements: RESIDENTIEL_COMPLET,
    impliedValues: {},
  },
}

/**
 * @param {string | null | undefined} typeBienNom
 * @returns {typeof ANNONCE_FORM_CONFIG_BY_TYPE[string] | null}
 */
export function getConfigForType(typeBienNom) {
  if (typeBienNom == null || typeBienNom === '') return null
  return ANNONCE_FORM_CONFIG_BY_TYPE[typeBienNom] ?? null
}

/**
 * Ne conserve que les clés d'équipement autorisées pour ce type.
 * @param {string | null | undefined} typeBienNom
 * @param {Record<string, unknown>} equipements
 * @returns {Record<string, unknown>}
 */
export function pickAllowedEquipements(typeBienNom, equipements) {
  const cfg = getConfigForType(typeBienNom)
  const source = equipements && typeof equipements === 'object' ? { ...equipements } : {}
  if (!cfg) return source

  const allowed = new Set(cfg.equipements)
  /** @type {Record<string, unknown>} */
  const out = {}
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = source[key]
    }
  }
  return out
}

/**
 * @param {unknown} v
 * @returns {number | null}
 */
function toNullableNumber(v) {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Applique impliedValues, masque les champs non visibles (null), fusionne les champs `storage: 'equipements'`,
 * filtre les équipements, convertit les nombres pour l'insert Supabase.
 * Ne gère pas `statut` (fourni au moment de la publication).
 *
 * @param {Record<string, unknown>} formData
 * @param {string | null | undefined} typeBienNom
 * @returns {Record<string, unknown>}
 */
export function sanitizeFormDataForSubmit(formData, typeBienNom) {
  const cfg = getConfigForType(typeBienNom)

  const base = { ...formData }
  /** @type {Record<string, unknown>} */
  let equipements =
    base.equipements && typeof base.equipements === 'object'
      ? { ...base.equipements }
      : {}

  if (!cfg) {
    return {
      titre: base.titre,
      description: base.description ? String(base.description) : null,
      type_bien_id: base.type_bien_id,
      transaction: base.transaction,
      prix: Number(base.prix),
      surface: toNullableNumber(base.surface),
      chambres: base.chambres !== '' && base.chambres != null ? toNullableNumber(base.chambres) : null,
      salles_de_bain:
        base.salles_de_bain !== '' && base.salles_de_bain != null
          ? toNullableNumber(base.salles_de_bain)
          : null,
      ville_id: base.ville_id,
      quartier_id: base.quartier_id || null,
      adresse: base.adresse ? String(base.adresse) : null,
      latitude: base.latitude ?? null,
      longitude: base.longitude ?? null,
      agence_id: base.agence_id,
      equipements: pickAllowedEquipements(typeBienNom, equipements),
    }
  }

  const implied = { ...cfg.impliedValues }

  // Champs stockés dans equipements (immeuble, local commercial)
  for (const [key, meta] of Object.entries(cfg.fields)) {
    if (meta.storage !== 'equipements') continue
    if (!meta.visible) {
      delete equipements[key]
      continue
    }
    const raw = equipements[key] !== undefined ? equipements[key] : base[key]
    if (key === 'nombre_etages' || key === 'nombre_lots') {
      equipements[key] = toNullableNumber(raw)
    } else {
      const def = EQUIPEMENT_DEFINITIONS[key]
      if (def?.type === 'boolean') {
        equipements[key] = !!raw
      } else if (def?.type === 'text' || def?.type === 'select') {
        equipements[key] = raw == null || raw === '' ? null : String(raw)
      } else {
        equipements[key] = raw ?? null
      }
    }
  }

  const f = cfg.fields

  /** @type {number | null} */
  let surface = null
  if (f.surface?.visible) {
    surface = toNullableNumber(base.surface)
  }

  /** @type {number | null} */
  let chambres = null
  if (f.chambres?.visible) {
    chambres =
      base.chambres !== '' && base.chambres != null ? toNullableNumber(base.chambres) : null
  }

  /** @type {number | null} */
  let salles_de_bain = null
  if (f.salles_de_bain?.visible) {
    salles_de_bain =
      base.salles_de_bain !== '' && base.salles_de_bain != null
        ? toNullableNumber(base.salles_de_bain)
        : null
  }

  if (Object.prototype.hasOwnProperty.call(implied, 'chambres')) {
    chambres = implied.chambres
  }
  if (Object.prototype.hasOwnProperty.call(implied, 'salles_de_bain')) {
    salles_de_bain = implied.salles_de_bain
  }

  let adresse = null
  if (f.adresse?.visible) {
    adresse = base.adresse ? String(base.adresse) : null
  }

  let description = null
  if (f.description?.visible) {
    description = base.description ? String(base.description) : null
  }

  equipements = pickAllowedEquipements(typeBienNom, equipements)

  return {
    titre: base.titre,
    description,
    type_bien_id: base.type_bien_id,
    transaction: base.transaction,
    prix: Number(base.prix),
    surface,
    chambres,
    salles_de_bain,
    ville_id: base.ville_id,
    quartier_id: base.quartier_id || null,
    adresse,
    latitude: base.latitude ?? null,
    longitude: base.longitude ?? null,
    agence_id: base.agence_id,
    equipements,
  }
}
