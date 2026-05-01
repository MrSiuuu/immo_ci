import { Lock, ShieldOff, XCircle } from 'lucide-react'

/**
 * Bandeaux de statut contextuels pour l’espace agent (vérification / suspension).
 */
export default function AgentStatusBanner({ verification_status, statut }) {
  if (statut === 'suspendue') {
    return (
      <div
        className="flex gap-3 border-b border-[#374151] bg-[#1F2937] px-4 py-3 text-sm text-[#F9FAFB]"
        role="status"
      >
        <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-[#F9FAFB]" aria-hidden />
        <div>
          <p className="font-semibold">Votre compte est suspendu</p>
          <p className="mt-1 text-white/85">
            L&apos;accès à votre espace est temporairement désactivé. Contactez l&apos;administrateur Nestymo.
          </p>
        </div>
      </div>
    )
  }

  if (verification_status === 'rejected') {
    return (
      <div
        className="flex gap-3 border-b border-[#DC2626] bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]"
        role="status"
      >
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#991B1B]" aria-hidden />
        <div>
          <p className="font-semibold">Votre agence a été refusée</p>
          <p className="mt-1 text-[#991B1B]/90">
            Votre demande de partenariat n&apos;a pas été acceptée. Contactez l&apos;administrateur pour plus
            d&apos;informations.
          </p>
        </div>
      </div>
    )
  }

  if (verification_status === 'pending') {
    return (
      <div
        className="flex gap-3 border-b border-[#D97B00] bg-[#FEF3C7] px-4 py-3 text-sm text-[#92400E]"
        role="status"
      >
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#92400E]" aria-hidden />
        <div>
          <p className="font-semibold">Votre agence est en cours de validation</p>
          <p className="mt-1 text-[#92400E]/90">
            Un administrateur doit valider votre compte avant que vous puissiez publier vos annonces. Vous pouvez
            préparer vos annonces en brouillon dès maintenant.
          </p>
        </div>
      </div>
    )
  }

  return null
}
