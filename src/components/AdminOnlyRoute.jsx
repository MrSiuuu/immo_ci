import { Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import ProfileUnavailable from './ProfileUnavailable'

/**
 * Espace /admin/* réservé aux comptes administrateur.
 */
export default function AdminOnlyRoute({ children }) {
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

  if (role === null) {
    return <ProfileUnavailable />
  }

  if (role !== 'admin') {
    if (role === 'agent') {
      return <Navigate to="/agence/dashboard" replace />
    }
    return <Navigate to="/login" replace />
  }

  return children
}
