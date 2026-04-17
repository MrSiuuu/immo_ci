import { useContext } from 'react'
import { UserContext } from '../contexts/UserContext'

/**
 * Accès au profil + rôle — doit être utilisé sous {@link UserProvider}.
 * @returns {{ user: { id: string, email: string } | null, role: 'admin' | 'agent' | 'user' | null, loading: boolean }}
 */
export function useUser() {
  const ctx = useContext(UserContext)
  if (ctx === undefined) {
    throw new Error('useUser doit être utilisé à l’intérieur d’un UserProvider')
  }
  return ctx
}
