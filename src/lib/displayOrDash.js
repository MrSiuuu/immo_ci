export function displayOrDash(value) {
  if (value == null) return '-'
  if (typeof value === 'string' && value.trim() === '') return '-'
  return value
}
