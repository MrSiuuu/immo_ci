import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/withTimeout'
import { agentNeedsOnboarding } from '../lib/agentOnboarding.js'

/**
 * Contexte utilisateur.
 * Profil enrichi : rôle, statut, must_change_password, agence (pour agent / onboarding).
 */
export const UserContext = createContext(undefined)

const PROFILE_TIMEOUT_MS = 20_000
const GET_SESSION_TIMEOUT_MS = 30_000

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [statut, setStatut] = useState(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [agenceId, setAgenceId] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [agence, setAgence] = useState(null)
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true)
  const [loading, setLoading] = useState(true)

  const authSnapshotRef = useRef({ userId: null, role: null })
  const shouldPreserveAuthState = useCallback((sessionUser, meta) => {
    if (meta !== 'TOKEN_REFRESHED' || !sessionUser?.id) return false
    const snap = authSnapshotRef.current
    return snap.userId === sessionUser.id && snap.role !== null
  }, [])

  const loadProfileForUser = useCallback(async (sessionUser, meta = '') => {
    if (!sessionUser) {
      setUser(null)
      setRole(null)
      setStatut(null)
      setMustChangePassword(false)
      setAgenceId(null)
      setIsOwner(false)
      setAgence(null)
      setHasSeenTutorial(true)
      authSnapshotRef.current = { userId: null, role: null }
      setLoading(false)
      return
    }

    setUser({ id: sessionUser.id, email: sessionUser.email ?? '' })

    try {
      // Colonnes stables (évite 400 si la migration has_seen_tutorial n’est pas encore appliquée).
      const { data: row, error } = await withTimeout(
        supabase
          .from('users')
          .select('role, statut, must_change_password, agence_id, is_owner')
          .eq('id', sessionUser.id)
          .single(),
        PROFILE_TIMEOUT_MS,
        `profil utilisateur > ${PROFILE_TIMEOUT_MS}ms`
      )

      if (error || !row) {
        if (shouldPreserveAuthState(sessionUser, meta)) {
          return
        }
        setRole(null)
        setStatut(null)
        setMustChangePassword(false)
        setAgenceId(null)
        setAgence(null)
        setHasSeenTutorial(true)
        authSnapshotRef.current = { userId: sessionUser.id, role: null }
        return
      }

      const r = row.role ?? null
      const st = row.statut ?? null
      const mcp = Boolean(row.must_change_password)
      const aid = row.agence_id ?? null
      const owner = Boolean(row.is_owner)

      setRole(r)
      setStatut(st)
      setMustChangePassword(mcp)
      setAgenceId(aid)
      setIsOwner(owner)

      // has_seen_tutorial : requête séparée pour ne pas casser le chargement si la colonne n’existe pas encore.
      try {
        const { data: tut, error: tutErr } = await withTimeout(
          supabase.from('users').select('has_seen_tutorial').eq('id', sessionUser.id).maybeSingle(),
          PROFILE_TIMEOUT_MS,
          `has_seen_tutorial > ${PROFILE_TIMEOUT_MS}ms`
        )
        if (!tutErr && tut && typeof tut.has_seen_tutorial === 'boolean') {
          setHasSeenTutorial(Boolean(tut.has_seen_tutorial))
        } else {
          setHasSeenTutorial(true)
        }
      } catch {
        setHasSeenTutorial(true)
      }

      if (aid) {
        const { data: ag, error: errAg } = await withTimeout(
          supabase
            .from('agences')
            .select(
              'id, nom, whatsapp, show_phone, show_email, show_whatsapp, verification_status, statut, ville, ville_id, quartier, description, adresse, telephone, email, site_web, logo, logo_url',
            )
            .eq('id', aid)
            .single(),
          PROFILE_TIMEOUT_MS,
          `agence liée > ${PROFILE_TIMEOUT_MS}ms`
        )
        if (!errAg && ag) {
          setAgence({
            ...ag,
            logo_url: ag.logo_url ?? ag.logo ?? null,
          })
        } else {
          setAgence(null)
        }
      } else {
        setAgence(null)
      }

      authSnapshotRef.current = { userId: sessionUser.id, role: r }
    } catch (e) {
      console.error('[UserContext] erreur chargement profil', meta, e)
      if (shouldPreserveAuthState(sessionUser, meta)) {
        return
      }
      setRole(null)
      setStatut(null)
      setMustChangePassword(false)
      setAgenceId(null)
      setIsOwner(false)
      setAgence(null)
      setHasSeenTutorial(true)
      authSnapshotRef.current = { userId: sessionUser.id, role: null }
    } finally {
      setLoading(false)
    }
  }, [shouldPreserveAuthState])

  /** Recharge le profil depuis la base (après changement mdp, onboarding, etc.). */
  const refreshProfile = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    setLoading(true)
    await loadProfileForUser(u, 'refreshProfile')
  }, [loadProfileForUser])

  useEffect(() => {
    let cancelled = false

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
      await loadProfileForUser(session?.user ?? null, 'bootstrap')
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) {
        setLoading(false)
        return
      }

      if (event === 'INITIAL_SESSION') {
        return
      }

      const uid = session?.user?.id ?? null
      const snap = authSnapshotRef.current

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setLoading(false)
        await loadProfileForUser(session.user, 'TOKEN_REFRESHED')
        return
      }

      if (event === 'SIGNED_IN' && uid && snap.userId === uid && snap.role !== null) {
        setLoading(false)
        return
      }

      setLoading(true)
      await loadProfileForUser(session?.user ?? null, event)

      if (!session?.user && !cancelled) {
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadProfileForUser])

  const needsAgentOnboarding = useMemo(
    () => agentNeedsOnboarding(role, agence),
    [role, agence]
  )

  const value = useMemo(
    () => ({
      user,
      role,
      statut,
      mustChangePassword,
      agenceId,
      isOwner,
      agence,
      loading,
      needsAgentOnboarding,
      hasSeenTutorial,
      refreshProfile,
    }),
    [user, role, statut, mustChangePassword, agenceId, isOwner, agence, loading, needsAgentOnboarding, hasSeenTutorial, refreshProfile]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
