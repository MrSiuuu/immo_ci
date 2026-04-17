import { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/withTimeout'

/**
 * Contexte utilisateur.
 * - Bootstrap : `getSession()` au montage → déclenche toujours le chargement du rôle (requête REST vers *.supabase.co).
 * - `onAuthStateChange` : on ignore `INITIAL_SESSION` (redondant avec getSession et source de courses).
 * - Autres événements : SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
 */
export const UserContext = createContext(undefined)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const authSnapshotRef = useRef({ userId: null, role: null })

  useEffect(() => {
    let cancelled = false

    async function loadSessionAndRole(sessionUser, meta = '') {
      if (!sessionUser) {
        if (!cancelled) {
          setUser(null)
          setRole(null)
          authSnapshotRef.current = { userId: null, role: null }
        }
        setLoading(false)
        return
      }

      if (!cancelled) {
        setUser({ id: sessionUser.id, email: sessionUser.email ?? '' })
      }

      const PROFILE_TIMEOUT_MS = 20_000

      try {
        const { data, error } = await withTimeout(
          supabase.from('users').select('role').eq('id', sessionUser.id).single(),
          PROFILE_TIMEOUT_MS,
          `profil utilisateur > ${PROFILE_TIMEOUT_MS}ms`
        )

        if (cancelled) return

        if (error || !data) {
          setRole(null)
          authSnapshotRef.current = { userId: sessionUser.id, role: null }
        } else {
          const r = data.role ?? null
          setRole(r)
          authSnapshotRef.current = { userId: sessionUser.id, role: r }
        }
      } catch (e) {
        console.error('[UserContext] erreur chargement profil', meta, e)
        if (!cancelled) {
          setRole(null)
          authSnapshotRef.current = { userId: sessionUser.id, role: null }
        }
      } finally {
        setLoading(false)
      }
    }

    /** Réseau lent / projet Supabase en pause : éviter un spinner infini tout en logguer le souci. */
    const GET_SESSION_TIMEOUT_MS = 30_000

    /** Obligatoire : seul ce flux garantit une requête REST après refresh (listener seul peut ne rien envoyer). */
    async function bootstrap() {
      setLoading(true)
      let session = null
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          GET_SESSION_TIMEOUT_MS,
          `getSession > ${GET_SESSION_TIMEOUT_MS}ms`
        )
        if (error) console.error('[UserContext] getSession', error)
        session = data?.session ?? null
      } catch (e) {
        console.error('[UserContext] session init', e)
      }
      if (cancelled) return
      await loadSessionAndRole(session?.user ?? null, 'bootstrap')
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) {
        setLoading(false)
        return
      }

      // Déjà couvert par bootstrap() — évite doublons et absences de requête réseau
      if (event === 'INITIAL_SESSION') {
        return
      }

      const uid = session?.user?.id ?? null
      const snap = authSnapshotRef.current

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setLoading(false)
        await loadSessionAndRole(session.user, 'TOKEN_REFRESHED')
        return
      }

      if (
        event === 'SIGNED_IN' &&
        uid &&
        snap.userId === uid &&
        snap.role !== null
      ) {
        setLoading(false)
        return
      }

      setLoading(true)
      await loadSessionAndRole(session?.user ?? null, event)

      if (!session?.user && !cancelled) {
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ user, role, loading }), [user, role, loading])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
