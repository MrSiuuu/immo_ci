export function sourceBadgeClass(source) {
  if (source === 'whatsapp') return 'bg-[#DCFCE7] text-[#166534]'
  if (source === 'telephone') return 'bg-[#DBEAFE] text-[#1D4ED8]'
  return 'bg-[#FFEDD5] text-[#C2410C]'
}

export function sourceLabel(source) {
  if (source === 'whatsapp') return 'WhatsApp'
  if (source === 'telephone') return 'Téléphone'
  return 'Formulaire'
}

export function formatLeadDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${date} ${h}h${m}`
}

/** Chiffres uniquement pour wa.me (sans +). */
export function phoneDigitsForWa(telephone) {
  if (telephone == null || telephone === '') return null
  const digits = String(telephone).replace(/\D/g, '')
  return digits.length > 0 ? digits : null
}
