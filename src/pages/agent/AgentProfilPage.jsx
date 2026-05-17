import { createElement, useCallback, useEffect, useState } from 'react'
import { Building2, Calendar, Mail, MapPin, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { displayOrDash } from '../../lib/displayOrDash'
import { useUser } from '../../hooks/useUser'
import { updateAgenceInfos } from '../../features/agences/agencesService.js'

const FONT_INTER = { fontFamily: '"Inter", sans-serif' }

const inputClass =
  'w-full rounded-lg border border-[#E8E3D8] bg-white px-3 py-2.5 text-sm text-[#0F1923] focus:outline-none focus:ring-2 focus:ring-[#E02020] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

const labelClass = 'mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200'

function Section({ icon, title, children }) {
  return (
    <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2 border-b border-[#E8E3D8] pb-3 dark:border-slate-700">
        {createElement(icon, { className: 'h-5 w-5 text-[#E02020]', 'aria-hidden': true })}
        <h2 className="text-lg font-semibold text-[#0F1923] dark:text-white" style={FONT_INTER}>
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function initialsFromNom(nom) {
  if (!nom?.trim()) return 'AG'
  const parts = nom.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return nom.trim().slice(0, 2).toUpperCase()
}

function membreDepuis(createdAt) {
  if (!createdAt) return '-'
  const d = new Date(createdAt)
  const mois = [
    'Janvier',
    'Fevrier',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Aout',
    'Septembre',
    'Octobre',
    'Novembre',
    'Decembre',
  ]
  return `${mois[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Profil agence (compte principal) - lecture carte + formulaire sans upload logo (voir Parametres).
 */
export default function AgentProfilPage() {
  const { agenceId, agence, refreshProfile } = useUser()
  const [villes, setVilles] = useState([])
  const [villeLabel, setVilleLabel] = useState('')
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [adresse, setAdresse] = useState('')
  const [site_web, setSiteWeb] = useState('')
  const [telephone, setTelephone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [villeId, setVilleId] = useState('')
  const [numeroAgr, setNumeroAgr] = useState('')
  const [pending, setPending] = useState(false)
  const [toast, setToast] = useState(null)
  const [formErr, setFormErr] = useState(null)
  const [fieldErrs, setFieldErrs] = useState({})

  const showToast = useCallback((type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  useEffect(() => {
    if (!agence) return
    setNom(agence.nom ?? '')
    setDescription(agence.description ?? '')
    setAdresse(agence.adresse ?? '')
    setSiteWeb(agence.site_web ?? '')
    setTelephone(agence.telephone ?? '')
    setWhatsapp(agence.whatsapp ?? '')
    setEmail(agence.email ?? '')
    setVilleId(agence.ville_id != null ? String(agence.ville_id) : '')
    setNumeroAgr(agence.numero_agrement_mclu ?? '')
  }, [agence])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data, error } = await supabase.from('villes').select('id, nom').order('nom')
      if (!mounted || error) return
      setVilles(data ?? [])
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!agence?.ville_id || !villes.length) {
      setVilleLabel(agence?.ville?.trim() || '-')
      return
    }
    const v = villes.find((x) => String(x.id) === String(agence.ville_id))
    setVilleLabel(v?.nom ?? agence?.ville ?? '-')
  }, [agence, villes])

  function validateForm() {
    const nextErrs = {}
    if (!nom.trim() || nom.trim().length < 2) {
      nextErrs.nom = 'Le nom de l agence doit contenir au moins 2 caracteres.'
    }
    const sw = site_web.trim()
    if (sw && !/^https?:\/\//i.test(sw)) {
      nextErrs.site_web = 'Le site web doit commencer par http:// ou https://'
    }
    const emailValue = email.trim()
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      nextErrs.email = 'Email invalide.'
    }
    const digits = (v) => v.replace(/\D/g, '')
    const telDigits = digits(telephone.trim())
    const waDigits = digits(whatsapp.trim())
    if (telephone.trim() && telDigits.length < 8) nextErrs.telephone = 'Telephone invalide (min 8 chiffres).'
    if (telephone.trim() && !/^[\d\s+().-]+$/.test(telephone.trim())) nextErrs.telephone = 'Telephone invalide.'
    if (whatsapp.trim() && waDigits.length < 8) nextErrs.whatsapp = 'WhatsApp invalide (min 8 chiffres).'
    if (whatsapp.trim() && !/^[\d\s+().-]+$/.test(whatsapp.trim())) nextErrs.whatsapp = 'WhatsApp invalide.'
    setFieldErrs(nextErrs)
    return Object.keys(nextErrs).length > 0 ? 'Veuillez corriger les champs invalides.' : null
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormErr(null)
    const v = validateForm()
    if (v) {
      setFormErr(v)
      return
    }
    if (!agenceId) return
    setPending(true)
    const { error } = await updateAgenceInfos(agenceId, {
      nom: nom.trim(),
      description: description.trim() || null,
      adresse: adresse.trim() || null,
      site_web: site_web.trim() || null,
      telephone: telephone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      email: email.trim() || null,
      ville_id: villeId || null,
      numero_agrement_mclu: numeroAgr.trim() || null,
    })
    setPending(false)
    if (error) {
      showToast('error', error.message ?? 'Enregistrement impossible.')
      return
    }
    await refreshProfile()
    showToast('success', 'Modifications enregistrees.')
  }

  const logoUrl = agence?.logo_url ?? agence?.logo ?? ''
  const verified = agence?.verification_status === 'verified'

  return (
    <div className="mx-auto max-w-6xl pb-8 text-[#0F1923]" style={FONT_INTER}>
      {toast ? (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Profil agence</h1>
        <p className="mt-1 text-sm text-[#666666]">Informations publiques - le logo se gere dans Parametres.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
        <aside className="h-fit rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-2 ring-[#E5E7EB]" />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E02020] text-2xl font-bold text-white"
                aria-hidden
              >
                {initialsFromNom(agence?.nom)}
              </div>
            )}
            <h2 className="mt-4 text-xl font-semibold text-[#111111]">{displayOrDash(agence?.nom)}</h2>
            {verified ? (
              <span className="mt-2 inline-flex rounded-full bg-[#E1F5EE] px-3 py-1 text-xs font-semibold text-[#0F6E56]">
                Agence verifiee
              </span>
            ) : null}
          </div>
          <ul className="mt-6 space-y-3 border-t border-[#F3F4F6] pt-6 text-left text-sm">
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
              <span>
                <span className="block text-xs font-medium text-[#6B7280]">Email</span>
                {displayOrDash(agence?.email)}
              </span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
              <span>
                <span className="block text-xs font-medium text-[#6B7280]">WhatsApp</span>
                {displayOrDash(agence?.whatsapp)}
              </span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
              <span>
                <span className="block text-xs font-medium text-[#6B7280]">Telephone</span>
                {displayOrDash(agence?.telephone)}
              </span>
            </li>
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
              <span>
                <span className="block text-xs font-medium text-[#6B7280]">Ville</span>
                {villeLabel}
              </span>
            </li>
            <li className="flex gap-2">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
              <span>
                <span className="block text-xs font-medium text-[#6B7280]">MCLU</span>
                {verified ? 'Verifie' : 'Non verifie'}
              </span>
            </li>
            <li className="flex gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
              <span>
                <span className="block text-xs font-medium text-[#6B7280]">Membre depuis</span>
                {membreDepuis(agence?.created_at)}
              </span>
            </li>
          </ul>
        </aside>

        <form onSubmit={handleSave} className="space-y-6">
          <Section icon={Building2} title="Modifier les informations">
            {formErr ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formErr}</p>
            ) : null}
            <div>
              <label className={labelClass} htmlFor="pf-nom">
                Nom de l agence
              </label>
              <input id="pf-nom" className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} required />
              {fieldErrs.nom ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.nom}</p> : null}
            </div>
            <div>
              <label className={labelClass} htmlFor="pf-email">
                Email
              </label>
              <input id="pf-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrs.email ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.email}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="pf-tel">
                  Telephone
                </label>
                <input id="pf-tel" className={inputClass} value={telephone} onChange={(e) => setTelephone(e.target.value)} />
                {fieldErrs.telephone ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.telephone}</p> : null}
              </div>
              <div>
                <label className={labelClass} htmlFor="pf-wa">
                  WhatsApp
                </label>
                <input id="pf-wa" className={inputClass} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                {fieldErrs.whatsapp ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.whatsapp}</p> : null}
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="pf-ville">
                Ville
              </label>
              <select id="pf-ville" className={inputClass} value={villeId} onChange={(e) => setVilleId(e.target.value)}>
                <option value="">Selectionner une ville</option>
                {villes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="pf-adr">
                Adresse
              </label>
              <input id="pf-adr" className={inputClass} value={adresse} onChange={(e) => setAdresse(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="pf-desc">
                Description
              </label>
              <textarea
                id="pf-desc"
                rows={4}
                className={inputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="pf-mclu">
                Numero agrement MCLU
              </label>
              <input id="pf-mclu" className={inputClass} value={numeroAgr} onChange={(e) => setNumeroAgr(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="pf-web">
                Site web
              </label>
              <input id="pf-web" className={inputClass} value={site_web} onChange={(e) => setSiteWeb(e.target.value)} placeholder="https://..." />
              {fieldErrs.site_web ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.site_web}</p> : null}
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[#E02020] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c81d1d] disabled:opacity-60"
            >
              {pending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </Section>
        </form>
      </div>
    </div>
  )
}
