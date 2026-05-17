import { sanitizeLocalInput } from '../lib/phoneCi.js'

const WHATSAPP_HELP =
  "Vérifiez que ce numéro est bien enregistré sur WhatsApp avec l'indicatif +225. Ex : +2250708123456"

/**
 * Saisie téléphone / WhatsApp Côte d'Ivoire : préfixe +225 fixe, chiffres locaux uniquement.
 */
export default function PhoneInputCI({
  id,
  label,
  labelClassName = 'mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200',
  value,
  onChange,
  inputClassName,
  required = false,
  error = null,
  showWhatsAppHelp = false,
}) {
  return (
    <div>
      {label ? (
        <label className={labelClassName} htmlFor={id}>
          {label}
          {required ? ' *' : ''}
        </label>
      ) : null}
      <div className="mt-0 flex overflow-hidden rounded-lg border border-[#E8E3D8] bg-white focus-within:ring-2 focus-within:ring-[#D97B00] dark:border-slate-600 dark:bg-slate-800 dark:focus-within:ring-[#D97B00]">
        <span
          className="flex shrink-0 items-center border-r border-[#E8E3D8] bg-[#F9FAFB] px-3 py-2.5 text-sm font-medium text-[#374151] select-none dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300"
          aria-hidden
        >
          +225
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          className={
            inputClassName ??
            'min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-[#0F1923] focus:outline-none focus:ring-0 dark:text-slate-100'
          }
          value={value}
          onChange={(e) => onChange(sanitizeLocalInput(e.target.value))}
          placeholder="0708123456"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [error ? `${id}-error` : null, showWhatsAppHelp ? `${id}-help` : null].filter(Boolean).join(' ') || undefined
          }
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-[#E53935]" role="alert">
          {error}
        </p>
      ) : null}
      {showWhatsAppHelp ? (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-[#6B7280] dark:text-slate-400">
          {WHATSAPP_HELP}
        </p>
      ) : null}
    </div>
  )
}
