import { Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'

/**
 * Réserve le contenu aux comptes avec rôle agent.
 */
export default function RequireAgent({ children }) {
  const { role, loading } = useUser()

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

  if (role !== 'agent') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}
