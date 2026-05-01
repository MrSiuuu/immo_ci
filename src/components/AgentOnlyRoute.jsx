import { Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import ProfileUnavailable from './ProfileUnavailable'

/**
 * Espace /agence/* réservé aux comptes agent.
 */
export default function AgentOnlyRoute({ children }) {
  const { user, role, loading } = useUser()

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

  return children
}
