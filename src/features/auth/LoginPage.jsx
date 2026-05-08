import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { connexion } from './authService'
import { supabase } from '../../lib/supabase'
import { withTimeout } from '../../lib/withTimeout'
import { useUser } from '../../hooks/useUser'
import { agentNeedsOnboarding } from '../../lib/agentOnboarding.js'

const AUTH_TIMEOUT_MS = 30_000

/**
 * Connexion admin ou agent - redirection selon mot de passe obligatoire et onboarding.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading: userLoading, role } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (userLoading || !user || !role) return
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
    } else if (role === 'agent') {
      navigate('/agence/dashboard', { replace: true })
    }
  }, [user, userLoading, role, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setPending(true)

    try {
      const { data, error: errAuth } = await withTimeout(
        connexion(email, password),
        AUTH_TIMEOUT_MS,
        `Connexion trop longue (>${AUTH_TIMEOUT_MS / 1000}s). Vérifiez le réseau et l’URL Supabase (.env).`
      )

      if (errAuth) {
        setError(errAuth.message)
        return
      }

      const { data: profil, error: errProfil } = await withTimeout(
        supabase
          .from('users')
          .select('role, statut, must_change_password, agence_id')
          .eq('id', data.user.id)
          .single(),
        AUTH_TIMEOUT_MS,
        `Chargement du profil trop long (>${AUTH_TIMEOUT_MS / 1000}s).`
      )

      if (errProfil || !profil) {
        setError('Profil utilisateur introuvable.')
        await supabase.auth.signOut()
        return
      }

      if (profil.statut !== 'actif') {
        setError('Compte suspendu. Contactez l’administrateur.')
        await supabase.auth.signOut()
        return
      }

      if (profil.must_change_password) {
        navigate('/change-password', { replace: true })
        return
      }

      if (profil.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
        return
      }

      if (profil.role === 'agent') {
        if (!profil.agence_id) {
          setError('Aucune agence liée à ce compte.')
          await supabase.auth.signOut()
          return
        }
        const { data: ag } = await supabase
          .from('agences')
          .select('whatsapp')
          .eq('id', profil.agence_id)
          .single()
        const needs = agentNeedsOnboarding('agent', ag ? { whatsapp: ag.whatsapp } : null)
        if (needs) {
          navigate('/agence/onboarding', { replace: true })
          return
        }
        navigate('/agence/dashboard', { replace: true })
        return
      }

      setError('Accès non autorisé')
      await supabase.auth.signOut()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion.'
      setError(msg)
      try {
        await supabase.auth.signOut()
      } catch {
        /* ignore */
      }
    } finally {
      setPending(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D97B00] border-t-transparent" aria-label="Chargement" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] md:flex-row">
      {/* Colonne gauche - formulaire (bloc centré verticalement) */}
      <div className="flex min-h-[100dvh] w-full flex-col bg-[#FFFFFF] md:h-screen md:w-1/2 md:min-h-0">
        <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-12 md:py-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E02020]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span
                  className="block text-xl font-semibold leading-tight text-[#111111]"
                  style={{ fontFamily: '"Inter", sans-serif' }}
                >
                  Nestymo
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-[#E02020]">NESTYMO PRO</span>
              </div>
            </div>

            <h2
              className="text-2xl font-semibold leading-tight text-[#111111]"
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              Bon retour parmi nous
            </h2>
            <p className="mt-2 text-sm text-[#666666]">
              Connectez-vous pour accéder à votre espace (admin ou agence)
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#666666]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-[#111111] placeholder:text-[#999999] focus:border-[#E02020] focus:outline-none focus:ring-1 focus:ring-[#E02020]"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#666666]">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-[#111111] placeholder:text-[#999999] focus:border-[#E02020] focus:outline-none focus:ring-1 focus:ring-[#E02020]"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full cursor-pointer rounded-full bg-[#E02020] px-4 py-2.5 font-semibold text-white transition hover:bg-[#c81d1d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            {error && (
              <p className="mt-5 text-center text-sm text-red-300 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Colonne droite - visuel + citation (masqué sur mobile) */}
      <div className="relative hidden min-h-screen w-full md:block md:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25" aria-hidden />
        <div className="relative z-10 flex min-h-screen flex-col justify-end px-8 pb-12 pt-24 md:px-12">
          <blockquote
            className="text-center text-lg italic leading-relaxed text-white md:text-xl"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            « L&apos;excellence immobilière commence par une relation de confiance. »
          </blockquote>
          <p className="mt-4 text-center text-sm font-medium text-[#E02020]/90">Nestymo - Abidjan</p>
        </div>
      </div>
    </div>
  )
}
