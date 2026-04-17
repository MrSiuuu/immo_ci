import { supabase } from '../../lib/supabase'

/**
 * Charge les listes pour les selects du formulaire d'annonce.
 */
export async function chargerDonneesReference() {
  const [typesRes, villesRes, agencesRes] = await Promise.all([
    supabase.from('types_biens').select('id, nom').order('nom'),
    supabase.from('villes').select('id, nom').order('nom'),
    supabase.from('agences').select('id, nom').eq('statut', 'active').order('nom'),
  ])

  const err = typesRes.error || villesRes.error || agencesRes.error
  if (err) {
    throw err
  }

  return {
    typesBiens: typesRes.data ?? [],
    villes: villesRes.data ?? [],
    agences: agencesRes.data ?? [],
  }
}

/**
 * Quartiers d'une ville (commune).
 */
export async function chargerQuartiers(ville_id) {
  const { data, error } = await supabase
    .from('quartiers')
    .select('id, nom')
    .eq('ville_id', ville_id)
    .order('nom')

  if (error) throw error
  return data ?? []
}

/**
 * Crée une ligne dans public.annonces.
 * @returns {Promise<{ annonce: object | null, error: Error | null }>}
 */
export async function creerAnnonce(donneesAnnonce) {
  const row = {
    titre: donneesAnnonce.titre,
    description: donneesAnnonce.description ?? null,
    type_bien_id: donneesAnnonce.type_bien_id,
    transaction: donneesAnnonce.transaction,
    prix: donneesAnnonce.prix,
    surface: donneesAnnonce.surface,
    chambres: donneesAnnonce.chambres,
    salles_de_bain: donneesAnnonce.salles_de_bain,
    ville_id: donneesAnnonce.ville_id,
    quartier_id: donneesAnnonce.quartier_id,
    adresse: donneesAnnonce.adresse,
    latitude: donneesAnnonce.latitude,
    longitude: donneesAnnonce.longitude,
    agence_id: donneesAnnonce.agence_id,
    statut: donneesAnnonce.statut,
    equipements: donneesAnnonce.equipements ?? {},
  }

  const { data, error } = await supabase.from('annonces').insert(row).select().single()

  if (error) {
    return { annonce: null, error }
  }
  return { annonce: data, error: null }
}

/**
 * Upload d'une photo vers le bucket Storage dédié.
 */
export async function uploadPhoto(file, agence_id, annonce_id) {
  const path = `${agence_id}/${annonce_id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('annonces-photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    return { path: null, url: null, error: uploadError }
  }

  const { data: pub } = supabase.storage.from('annonces-photos').getPublicUrl(path)

  return {
    path,
    url: pub.publicUrl,
    error: null,
  }
}

/**
 * Insère les lignes photos liées à l'annonce.
 */
export async function enregistrerPhotos(photos, annonce_id) {
  const rows = photos.map((p) => ({
    annonce_id,
    url: p.url,
    ordre: p.ordre,
    is_principale: p.is_principale,
  }))

  const { error } = await supabase.from('photos').insert(rows)
  return { error }
}
