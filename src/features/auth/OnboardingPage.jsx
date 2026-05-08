import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { modifierAgence } from '../agences/agencesService.js'
import { useUser } from '../../hooks/useUser'
import { agentNeedsOnboarding } from '../../lib/agentOnboarding.js'

const inputClass =
  'w-full rounded-lg border border-[#E8E3D8] bg-white px-3 py-2.5 text-sm text-[#0F1923] focus:outline-none focus:ring-2 focus:ring-[#D97B00] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

/**
 * Onboarding agent : étape 1 WhatsApp obligatoire, puis étape 2 (liens annonce / dashboard).
 * L’étape affichée dérive de `agentNeedsOnboarding` après enregistrement (pas d’état « step » séparé).
 */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { role, agenceId, agence, loading, mustChangePassword, refreshProfile } = useUser()
  const [whatsapp, setWhatsapp] = useState(() => (agence?.whatsapp != null ? String(agence.whatsapp) : ''))
  const [description, setDescription] = useState(() => agence?.description ?? '')
  const [logo, setLogo] = useState(() => agence?.logo ?? '')
  const [telephone, setTelephone] = useState(() => agence?.telephone ?? '')
  const [adresse, setAdresse] = useState(() => agence?.adresse ?? '')
  const [err, setErr] = useState(null)
  const [pending, setPending] = useState(false)

  const needsStep1 = role === 'agent' && agence && agentNeedsOnboarding(role, agence)

  if (loading || !agenceId || mustChangePassword) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#0F1923]/70 dark:text-slate-400">
        Chargement…
      </div>
    )
  }

  if (role !== 'agent') {
    return null
  }

  async function handleEtape1(e) {
    e.preventDefault()
    setErr(null)
    if (!whatsapp.trim()) {
      setErr('Le numéro WhatsApp est obligatoire.')
      return
    }
    setPending(true)
    const { error } = await modifierAgence(agenceId, {
      whatsapp: whatsapp.trim(),
      description: description.trim() || null,
      logo: logo.trim() || null,
      telephone: telephone.trim() || null,
      adresse: adresse.trim() || null,
    })
    setPending(false)
    if (error) {
      setErr(error)
      return
    }
    await refreshProfile()
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight text-[#0F1923] dark:text-white"
          style={{ fontFamily: '"Inter", sans-serif' }}
        >
          Bienvenue sur Nestymo
        </h1>
        <p className="mt-1 text-sm text-[#0F1923]/65 dark:text-slate-400">
          {needsStep1
            ? 'Complétez les informations de votre agence pour finaliser votre profil.'
            : 'Votre profil est prêt !'}
        </p>
      </div>

      {needsStep1 ? (
        <form
          onSubmit={handleEtape1}
          className="space-y-4 rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F1923]/50 dark:text-slate-500">
            Étape 1 - Profil agence
          </h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">WhatsApp *</label>
            <input className={inputClass} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Description</label>
            <textarea
              className={`${inputClass} min-h-[96px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Logo (URL)</label>
            <input className={inputClass} value={logo} onChange={(e) => setLogo(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Téléphone</label>
            <input className={inputClass} value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Adresse</label>
            <input className={inputClass} value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          </div>
          {err && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[#E02020] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c81d1d] disabled:opacity-60"
          >
            {pending ? 'Enregistrement…' : 'Continuer'}
          </button>
        </form>
      ) : (
        <div className="space-y-6 rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F1923]/50 dark:text-slate-500">
            Étape 2 - Première annonce
          </h2>
          <p className="text-sm text-[#0F1923]/80 dark:text-slate-300">
            Votre profil est prêt ! Publiez votre première annonce pour apparaître sur Nestymo.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/agence/annonces/new')}
              className="rounded-lg bg-[#1D9E75] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#188a66]"
            >
              Publier ma première annonce
            </button>
            <button
              type="button"
              onClick={() => navigate('/agence/dashboard')}
              className="rounded-full border border-[#E02020] px-5 py-2.5 text-sm font-medium text-[#E02020] hover:bg-[#E02020]/10"
            >
              Passer cette étape
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
