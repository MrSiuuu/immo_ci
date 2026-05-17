const CI_PREFIX = '+225'
const LOCAL_MIN = 8
const LOCAL_MAX = 10

/** Extrait les chiffres locaux (sans indicatif 225) depuis une valeur BDD. */
export function parseLocalDigits(stored) {
  if (stored == null || stored === '') return ''
  const digits = String(stored).replace(/\D/g, '')
  if (digits.startsWith('225') && digits.length > 3) return digits.slice(3)
  return digits
}

/** Garde uniquement les chiffres locaux (max 10). */
export function sanitizeLocalInput(raw) {
  return String(raw).replace(/\D/g, '').slice(0, LOCAL_MAX)
}

/**
 * @param {string} localDigits
 * @param {{ required?: boolean }} [opts]
 * @returns {string|null} message d'erreur ou null
 */
export function validateLocalDigits(localDigits, { required = false } = {}) {
  const d = sanitizeLocalInput(localDigits)
  if (!d) {
    if (required) return 'Ce numéro est obligatoire.'
    return null
  }
  if (d.length < LOCAL_MIN || d.length > LOCAL_MAX || !/^\d+$/.test(d)) {
    return 'Le numéro doit contenir entre 8 et 10 chiffres (sans espaces ni tirets).'
  }
  return null
}

/** Concatène +225 et les chiffres locaux pour la BDD. */
export function formatPhoneForDb(localDigits) {
  const d = sanitizeLocalInput(localDigits)
  if (!d) return null
  return `${CI_PREFIX}${d}`
}

export const PHONE_CI_PREFIX = CI_PREFIX
