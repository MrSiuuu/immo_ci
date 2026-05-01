/**
 * Profil agent « complet » pour l’onboarding : WhatsApp renseigné sur l’agence (CDC V2).
 */
export function agentNeedsOnboarding(role, agence) {
  if (role !== 'agent' || !agence) return false
  const w = agence.whatsapp
  return w == null || String(w).trim() === ''
}
