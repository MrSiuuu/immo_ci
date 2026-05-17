import { supabase } from '../../lib/supabase'

const CREATE_AGENT_FUNCTION_CANDIDATES = Array.from(
  new Set(
    [
      import.meta.env.VITE_CREATE_AGENT_FUNCTION_NAME,
      'quick-handler',
      'create-agent',
    ].filter((name) => typeof name === 'string' && name.trim().length > 0),
  ),
)

function isFunctionNotFoundError(error) {
  const msg = String(error?.message ?? '').toLowerCase()
  return (
    msg.includes('not found') ||
    msg.includes('does not exist') ||
    msg.includes('404') ||
    msg.includes('no route matched')
  )
}

export async function getAllAgences({ page = 1, limit = 10, search = '' } = {}) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('agences')
    .select('id, nom, logo, logo_url, email, telephone, whatsapp, statut, verification_status, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search.trim() !== '') {
    query = query.ilike('nom', `%${search.trim()}%`)
  }

  const { data, error, count } = await query
  if (error) {
    console.error('[agencesService] getAllAgences:', error.message)
    return { data: [], error: error.message, count: 0 }
  }
  return { data: data ?? [], error: null, count: count ?? 0 }
}

/**
 * Nombre d’agents par agence_id (rôle agent uniquement).
 */
export async function getAgentCountsByAgenceIds() {
  const { data, error } = await supabase
    .from('users')
    .select('agence_id')
    .eq('role', 'agent')
    .not('agence_id', 'is', null)

  if (error) {
    console.error('[agencesService] getAgentCountsByAgenceIds:', error.message)
    return {}
  }
  /** @type {Record<string, number>} */
  const counts = {}
  for (const row of data ?? []) {
    const id = row.agence_id
    if (!id) continue
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

export async function getAgenceById(id) {
  const { data, error } = await supabase
    .from('agences')
    .select(`
      id, nom, description, logo, logo_url, adresse, ville, ville_id, quartier,
      telephone, whatsapp, email, site_web, statut, verification_status, created_at, created_by,
      numero_agrement_mclu
    `)
    .eq('id', id)
    .single()
  if (error) {
    console.error('[agencesService] getAgenceById:', error.message)
    return null
  }
  return data
}

/**
 * Comptes agents liés à une agence.
 */
export async function getAgentsParAgence(agence_id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, nom, prenom, statut, must_change_password, created_at, is_owner')
    .eq('agence_id', agence_id)
    .eq('role', 'agent')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[agencesService] getAgentsParAgence:', error.message)
    return []
  }
  return data ?? []
}

export async function creerAgence(donnees) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { agence: null, error: 'Non authentifié' }
  const { data, error } = await supabase
    .from('agences')
    .insert({ ...donnees, created_by: user.id, statut: 'active', verification_status: 'pending' })
    .select()
    .single()
  if (error) return { agence: null, error: error.message }
  return { agence: data, error: null }
}

export async function modifierAgence(id, donnees) {
  const { data, error } = await supabase.from('agences').update(donnees).eq('id', id).select().single()
  if (error) return { agence: null, error: error.message }
  return { agence: data, error: null }
}

export async function setVerificationStatus(id, status) {
  const { error } = await supabase.from('agences').update({ verification_status: status }).eq('id', id)
  return { error: error?.message ?? null }
}

export async function setStatutAgence(id, statut) {
  const { error } = await supabase.from('agences').update({ statut }).eq('id', id)
  return { error: error?.message ?? null }
}

/**
 * Désactive un compte agent (suspend sans supprimer).
 */
export async function setStatutAgent(userId, statut) {
  const { error } = await supabase.from('users').update({ statut }).eq('id', userId)
  return { error: error?.message ?? null }
}

/** Champs modifiables par l’agent (hors statut, vérification, créateur). */
const CHAMPS_AGENCE_AGENT = new Set([
  'nom',
  'description',
  'adresse',
  'ville',
  'ville_id',
  'quartier',
  'telephone',
  'whatsapp',
  'email',
  'site_web',
  'logo',
  'logo_url',
  'numero_agrement_mclu',
  'show_phone',
  'show_email',
  'show_whatsapp',
])

/**
 * Mise à jour des infos agence par un agent - champs sensibles exclus côté client.
 */
export async function updateAgenceInfos(agenceId, donnees) {
  const donneesFiltreesRaw = Object.fromEntries(
    Object.entries(donnees).filter(([k, v]) => CHAMPS_AGENCE_AGENT.has(k) && v !== undefined),
  )
  const donneesFiltrees = { ...donneesFiltreesRaw }
  if ('logo_url' in donneesFiltreesRaw) {
    donneesFiltrees.logo = donneesFiltreesRaw.logo_url
  } else if ('logo' in donneesFiltreesRaw) {
    donneesFiltrees.logo_url = donneesFiltreesRaw.logo
  }

  const { data, error } = await supabase
    .from('agences')
    .update(donneesFiltrees)
    .eq('id', agenceId)
    .select()
    .single()
  return { data, error }
}

/**
 * Crée un compte agent via Edge Function (service_role jamais côté client).
 * Envoie explicitement le JWT + la clé anon : sans ça, la passerelle Supabase répond souvent **401 Unauthorized**.
 */
export async function creerCompteAgent({ email, password, agence_id, nom, prenom }) {
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  let {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    const { data: ref, error: refErr } = await supabase.auth.refreshSession()
    if (refErr || !ref.session?.access_token) {
      return {
        success: false,
        error: 'Session expirée - déconnectez-vous et reconnectez-vous en tant qu’admin.',
      }
    }
    session = ref.session
  }

  const payload = {
    body: { email, password, agence_id, nom, prenom },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
    },
  }

  let lastError = null
  for (const functionName of CREATE_AGENT_FUNCTION_CANDIDATES) {
    const { data, error } = await supabase.functions.invoke(functionName, payload)

    if (error) {
      lastError = error
      if (isFunctionNotFoundError(error)) continue
      return { success: false, error: error.message }
    }

    if (data?.error) return { success: false, error: data.error }
    return { success: true, user_id: data.user_id, email: data.email }
  }

  return {
    success: false,
    error: lastError?.message ?? 'Impossible d’appeler la fonction de création d’agent',
  }
}
