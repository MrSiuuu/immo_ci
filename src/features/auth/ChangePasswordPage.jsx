import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'

/**
 * Changement de mot de passe obligatoire (première connexion agent).
 */
export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { user, role, mustChangePassword, needsAgentOnboarding, loading, refreshProfile } = useUser()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!loading && user && !mustChangePassword) {
      if (role === 'agent') {
        navigate('/agence/dashboard', { replace: true })
      } else {
        navigate('/admin/dashboard', { replace: true })
      }
    }
  }, [loading, user, mustChangePassword, role, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(null)
    if (password.length < 8) {
      setErr('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setErr('Les deux mots de passe ne correspondent pas.')
      return
    }
    if (!user?.id) {
      setErr('Session invalide.')
      return
    }

    setPending(true)
    const { error: errAuth } = await supabase.auth.updateUser({ password })
    if (errAuth) {
      setErr(errAuth.message ?? 'Impossible de mettre à jour le mot de passe.')
      setPending(false)
      return
    }

    const { error: errDb } = await supabase
      .from('users')
      .update({ must_change_password: false })
      .eq('id', user.id)

    if (errDb) {
      setErr(errDb.message ?? 'Mot de passe mis à jour mais erreur profil - contactez le support.')
      setPending(false)
      return
    }

    try {
      await refreshProfile()
    } catch (e) {
      setPending(false)
      throw e
    }
    setPending(false)
    queueMicrotask(() => {
      if (role === 'agent') {
        navigate(needsAgentOnboarding ? '/agence/onboarding' : '/agence/dashboard', { replace: true })
        return
      }
      navigate('/admin/dashboard', { replace: true })
    })
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D97B00] border-t-transparent" aria-label="Chargement" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1A1A2E] px-4 py-12 dark:bg-[#151525]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-xl font-semibold text-[#E02020]" style={{ fontFamily: '"Inter", sans-serif' }}>
            Nestymo
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-white" style={{ fontFamily: '"Inter", sans-serif' }}>
            Nouveau mot de passe
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Pour des raisons de sécurité, vous devez choisir un mot de passe personnel avant de continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div>
            <label htmlFor="np" className="mb-1.5 block text-sm font-medium text-white/70">
              Nouveau mot de passe
            </label>
            <input
              id="np"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#E02020]"
            />
          </div>
          <div>
            <label htmlFor="npc" className="mb-1.5 block text-sm font-medium text-white/70">
              Confirmation
            </label>
            <input
              id="npc"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#E02020]"
            />
          </div>
          {err && (
            <p className="text-center text-sm text-red-300" role="alert">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-[#E02020] px-4 py-2.5 font-semibold text-white transition hover:bg-[#c81d1d] disabled:opacity-60"
          >
            {pending ? 'Enregistrement…' : 'Enregistrer et continuer'}
          </button>
        </form>
      </div>
    </div>
  )
}
