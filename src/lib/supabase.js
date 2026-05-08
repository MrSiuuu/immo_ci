// Client Supabase - une seule instance dans le navigateur (y compris après HMR Vite).
// Réutilisation via globalThis pour éviter plusieurs GoTrueClient / contention sur le lock auth.
//
// Important : `auth.lock` attend une fonction (LockFunc), pas la chaîne 'navigator'.
// Avec persistSession: true, la lib utilise déjà navigatorLock (Web Locks API) par défaut.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[supabase] Variables d\'environnement manquantes')
}

const g = globalThis
// V2 : options auth.lock explicites - ne pas réutiliser l’ancienne instance sous une autre clé après changement.
const SINGLETON_KEY = '__IMMOCI_SUPABASE_CLIENT_V2__'

/** Même sémantique que lockNoOp du SDK : pas de Web Locks API (évite blocages infinis sur getSession / init). */
async function authLockNoOp(_name, _acquireTimeout, fn) {
  return await fn()
}

function createClientOnce() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      // Sans ça, navigator.locks peut bloquer initializePromise → getSession() ne finit jamais → aucun appel *.supabase.co
      lock: authLockNoOp,
    },
  })
}

if (!g[SINGLETON_KEY]) {
  g[SINGLETON_KEY] = createClientOnce()
}

export const supabase = g[SINGLETON_KEY]
