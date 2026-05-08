import { supabase } from '../../lib/supabase'

export async function getPublishedAnnoncesCount() {
  const { count, error } = await supabase
    .from('annonces')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'publie')
  if (error) return { count: 0, error }
  return { count: count ?? 0, error: null }
}

export async function getAdminDashboardStats() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const [annoncesRes, annoncesTotalRes, agencesRes, leadsTodayRes, recentRes] = await Promise.all([
    supabase.from('annonces').select('id', { count: 'exact', head: true }).eq('statut', 'publie'),
    supabase.from('annonces').select('id', { count: 'exact', head: true }),
    supabase.from('agences').select('id', { count: 'exact', head: true }).eq('statut', 'active'),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase
      .from('annonces')
      .select('id, titre, prix, statut, created_at, agences(nom)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const error = annoncesRes.error || annoncesTotalRes.error || agencesRes.error || leadsTodayRes.error || recentRes.error
  if (error) {
    return {
      stats: { annoncesPubliees: 0, agencesActives: 0, leadsAujourdHui: 0, totalAnnonces: 0, tauxPublication: 0 },
      annoncesRecentes: [],
      activite: [],
      error,
    }
  }

  const annoncesRecentes = (recentRes.data ?? []).slice(0, 5)
  const activite = (recentRes.data ?? []).map((row) => ({
    id: row.id,
    texte: `Nouvelle annonce: ${row.titre ?? 'Sans titre'} - ${row.agences?.nom ?? 'Agence inconnue'}`,
    temps: row.created_at,
  }))

  const annoncesPubliees = annoncesRes.count ?? 0
  const totalAnnonces = annoncesTotalRes.count ?? 0
  const tauxPublication = totalAnnonces > 0 ? Math.round((annoncesPubliees / totalAnnonces) * 100) : 0

  return {
    stats: {
      annoncesPubliees,
      agencesActives: agencesRes.count ?? 0,
      leadsAujourdHui: leadsTodayRes.count ?? 0,
      totalAnnonces,
      tauxPublication,
    },
    annoncesRecentes,
    activite,
    error: null,
  }
}

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
    .select('*')
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    created_by: user?.id ?? null,
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

/**
 * Retourne l'agence systeme "Nestymo Admin" pour rattacher les annonces admin.
 * Cree l'agence si elle n'existe pas.
 */
export async function getOrCreateNestymoAdminAgency() {
  const { data: existing, error: findErr } = await supabase
    .from('agences')
    .select('id')
    .eq('nom', 'Nestymo Admin')
    .limit(1)
    .maybeSingle()

  if (findErr) {
    return { agenceId: null, error: findErr }
  }
  if (existing?.id) {
    return { agenceId: existing.id, error: null }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return { agenceId: null, error: new Error('Utilisateur non authentifie') }
  }

  const { data: created, error: createErr } = await supabase
    .from('agences')
    .insert({
      nom: 'Nestymo Admin',
      description: 'Agence systeme pour les annonces creees par les administrateurs',
      statut: 'active',
      verification_status: 'verified',
      created_by: user.id,
    })
    .select('id')
    .single()

  return { agenceId: created?.id ?? null, error: createErr ?? null }
}
