import { useUser } from '../../hooks/useUser'

/**
 * Point d'entrée auth côté feature — expose session + rôle comme useUser.
 */
export function useAuth() {
  return useUser()
}
