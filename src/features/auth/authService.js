import { supabase } from '../../lib/supabase'

/**
 * Connexion email / mot de passe (Supabase Auth).
 * @returns {Promise<{ data: object, error: Error | null }>}
 */
export async function connexion(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

/**
 * Déconnexion de la session courante.
 * @returns {Promise<{ error: Error | null }>}
 */
export async function deconnexion() {
  return supabase.auth.signOut()
}
