import { Navigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useUser } from '../hooks/useUser'
import ProfileUnavailable from './ProfileUnavailable'
import { deconnexion } from '../features/auth/authService'

/**
 * Espace /agence/* réservé aux comptes agent.
 */
export default function AgentOnlyRoute({ children }) {
  const { user, role, statut, loading } = useUser()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF6EF] dark:bg-slate-950">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-[#D97B00] border-t-transparent"
          aria-label="Chargement"
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Ne pas renvoyer vers /admin si le rôle est inconnu (erreur API) : boucle infinie avec AdminOnlyRoute.
  if (role === null) {
    return <ProfileUnavailable />
  }

  if (role !== 'agent') {
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/login" replace />
  }

  if (statut === 'suspendu') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F7FA] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]">
            <Lock className="h-6 w-6 text-[#111111]" />
          </div>
          <h1 className="text-lg font-semibold text-[#111111]">Compte suspendu</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Votre compte a été suspendu. Contactez votre agence.</p>
          <button
            type="button"
            onClick={async () => {
              await deconnexion()
            }}
            className="mt-5 rounded-full bg-[#111111] px-4 py-2 text-sm font-medium text-white"
          >
            Déconnexion
          </button>
        </div>
      </div>
    )
  }

  return children
}
