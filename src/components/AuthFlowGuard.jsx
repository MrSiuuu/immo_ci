import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../hooks/useUser'

/**
 * Redirige vers changement de mot de passe ou onboarding agent avant le reste de l’app.
 */
export default function AuthFlowGuard({ children }) {
  const { user, loading, role, mustChangePassword, needsAgentOnboarding } = useUser()
  const location = useLocation()
  const path = location.pathname

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

  if (mustChangePassword && path !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (
    role === 'agent' &&
    !mustChangePassword &&
    needsAgentOnboarding &&
    !path.startsWith('/agence/onboarding')
  ) {
    return <Navigate to="/agence/onboarding" replace />
  }

  return children
}
