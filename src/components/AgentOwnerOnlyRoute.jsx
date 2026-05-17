import { Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'

/**
 * Routes reservees au compte principal agence (`is_owner` sur users).
 * A utiliser a l'interieur de {@link AgentOnlyRoute} (deja authentifie agent actif).
 */
export default function AgentOwnerOnlyRoute({ children }) {
  const { isOwner, loading } = useUser()

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

  if (!isOwner) {
    return <Navigate to="/agence/dashboard" replace />
  }

  return children
}
