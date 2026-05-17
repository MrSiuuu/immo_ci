/**
 * Libelles affichage des plans d'abonnement (enum PostgreSQL en snake case).
 */
export function labelAbonnementPlan(plan) {
  if (plan == null || plan === '') return 'Starter'
  const key = String(plan).toLowerCase()
  const map = {
    starter: 'Starter',
    basique: 'Basique',
    premium: 'Premium',
    pro: 'Pro',
  }
  return map[key] ?? String(plan)
}
