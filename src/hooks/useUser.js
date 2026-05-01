import { useContext } from 'react'
import { UserContext } from '../contexts/UserContext.jsx'

/**
 * Accès au profil + rôle — doit être utilisé sous {@link UserProvider}.
 * @returns {{
 *   user: { id: string, email: string } | null,
 *   role: 'admin' | 'agent' | 'user' | null,
 *   statut: string | null,
 *   mustChangePassword: boolean,
 *   agenceId: string | null,
 *   agence: object | null,
 *   loading: boolean,
 *   needsAgentOnboarding: boolean,
 *   hasSeenTutorial: boolean,
 *   refreshProfile: () => Promise<void>
 * }}
 */
export function useUser() {
  const ctx = useContext(UserContext)
  if (ctx === undefined) {
    throw new Error('useUser doit être utilisé à l’intérieur d’un UserProvider')
  }
  return ctx
}
