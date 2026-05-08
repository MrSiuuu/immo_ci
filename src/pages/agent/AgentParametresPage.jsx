import { createElement, useCallback, useEffect, useState } from 'react'
import { Building2, Image, KeyRound, MapPin, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { setStatutAgent, updateAgenceInfos } from '../../features/agences/agencesService.js'

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

/**
 * Paramètres agence - champs autorisés + changement de mot de passe.
 */
export default function AgentParametresPage() {
  const { user, agenceId, agence, isOwner, refreshProfile } = useUser()
  const [villes, setVilles] = useState([])
  const [quartiers, setQuartiers] = useState([])
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [adresse, setAdresse] = useState('')
  const [site_web, setSiteWeb] = useState('')
  const [telephone, setTelephone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [villeId, setVilleId] = useState('')
  const [quartier, setQuartier] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [toast, setToast] = useState(null)
  const [formErr, setFormErr] = useState(null)
  const [fieldErrs, setFieldErrs] = useState({})
  const [comptesAgence, setComptesAgence] = useState([])
  const [showPhone, setShowPhone] = useState(true)
  const [showEmail, setShowEmail] = useState(true)
  const [showWhatsapp, setShowWhatsapp] = useState(true)
  const [agentActionLoadingId, setAgentActionLoadingId] = useState(null)

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
    setQuartier(agence.quartier ?? '')
    setLogoUrl(agence.logo_url ?? agence.logo ?? '')
    setShowPhone(agence.show_phone !== false)
    setShowEmail(agence.show_email !== false)
    setShowWhatsapp(agence.show_whatsapp !== false)
  }, [agence])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!agenceId || !isOwner) {
        setComptesAgence([])
        return
      }
      const { data } = await supabase.from('users').select('id, nom, prenom, email, statut, is_owner, created_at').eq('agence_id', agenceId).order('created_at', { ascending: true })
      if (mounted) setComptesAgence(data ?? [])
    })()
    return () => {
      mounted = false
    }
  }, [agenceId, isOwner])

  useEffect(() => {
    let mounted = true
    async function loadQuartiers() {
      if (!villeId) {
        setQuartiers([])
        return
      }
      const { data, error } = await supabase.from('quartiers').select('id, nom').eq('ville_id', villeId).order('nom')
      if (!mounted || error) return
      setQuartiers(data ?? [])
    }
    loadQuartiers()
    return () => {
      mounted = false
    }
  }, [villeId])

  useEffect(() => {
    let mounted = true
    async function loadVilles() {
      const { data, error } = await supabase.from('villes').select('id, nom').order('nom')
      if (!mounted || error) return
      setVilles(data ?? [])
    }
    loadVilles()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  const showToast = useCallback((type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4000)
  }, [])

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

  async function handleSaveAgence(e) {
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
      quartier: quartier.trim() || null,
      logo_url: logoUrl.trim() || null,
    })
    setPending(false)
    if (error) {
      showToast('error', error.message ?? 'Enregistrement impossible.')
      return
    }
    await refreshProfile()
    showToast('success', 'Modifications enregistrées.')
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const okTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!okTypes.includes(file.type)) {
      showToast('error', 'Formats acceptés : JPG, PNG, WEBP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image trop volumineuse (max 2 Mo).')
      return
    }
    setLogoFile(file)
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleUploadLogo() {
    if (!logoFile || !agenceId) return
    setPending(true)
    const oldPath = (() => {
      const oldUrl = agence?.logo_url ?? agence?.logo ?? ''
      const marker = '/storage/v1/object/public/annonces-photos/'
      const idx = oldUrl.indexOf(marker)
      return idx >= 0 ? oldUrl.slice(idx + marker.length) : null
    })()
    if (oldPath) {
      await supabase.storage.from('annonces-photos').remove([oldPath])
    }
    const path = `agences/${agenceId}/logos/${Date.now()}-${logoFile.name.replace(/[^\w.-]/g, '_')}`
    const { error: upErr } = await supabase.storage.from('annonces-photos').upload(path, logoFile, {
      cacheControl: '3600',
      upsert: false,
    })
    if (upErr) {
      setPending(false)
      showToast('error', upErr.message ?? 'Upload impossible (vérifiez les droits storage).')
      return
    }
    const { data: pub } = supabase.storage.from('annonces-photos').getPublicUrl(path)
    const url = pub?.publicUrl ?? ''
    const { error } = await updateAgenceInfos(agenceId, { logo_url: url })
    setPending(false)
    if (error) {
      showToast('error', error.message ?? 'Mise à jour du logo impossible.')
      return
    }
    setLogoUrl(url)
    setLogoFile(null)
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview('')
    await refreshProfile()
    showToast('success', 'Logo mis à jour.')
  }

  async function handlePassword(e) {
    e.preventDefault()
    setFormErr(null)
    if (!pwdNew || pwdNew.length < 8) {
      setFormErr('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (pwdNew !== pwdConfirm) {
      setFormErr('Les mots de passe ne correspondent pas.')
      return
    }
    setPending(true)
    if (!pwdCurrent) {
      setFormErr('Le mot de passe actuel est requis.')
      setPending(false)
      return
    }
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: pwdCurrent,
    })
    if (authErr) {
      setPending(false)
      setFormErr('Mot de passe actuel incorrect.')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: pwdNew })
    setPending(false)
    if (error) {
      showToast('error', error.message ?? 'Changement impossible.')
      return
    }
    setPwdCurrent('')
    setPwdNew('')
    setPwdConfirm('')
    showToast('success', 'Mot de passe mis à jour.')
  }

  async function handleOwnerCredentials(e) {
    e.preventDefault()
    setFormErr(null)
    if (!email.trim()) {
      setFormErr('Veuillez renseigner le nouvel email.')
      return
    }
    const { error } = await supabase.auth.updateUser({ email: email.trim() })
    if (error) {
      showToast('error', error.message ?? 'Mise à jour email impossible.')
      return
    }
    showToast('success', 'Email de connexion mis à jour. Un email de confirmation a été envoyé.')
  }

  async function toggleCoord(field, value) {
    if (!agenceId) return
    const { error } = await updateAgenceInfos(agenceId, { [field]: value })
    if (error) {
      showToast('error', error.message ?? 'Mise à jour impossible.')
      return
    }
    showToast('success', 'Coordonnée publique mise à jour.')
    await refreshProfile()
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-8 text-[#0F1923]">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight" style={FONT_INTER}>Paramètres</h1>
          <p className="mt-1 text-sm text-[#666666]">Compte secondaire : vous pouvez uniquement modifier vos identifiants.</p>
        </header>
        {formErr ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formErr}</p> : null}
        <form onSubmit={handleOwnerCredentials} className="space-y-4 rounded-2xl border border-[#E8E3D8] bg-white p-6">
          <label className={labelClass} htmlFor="agent-login-email">Modifier mon adresse email de connexion</label>
          <input id="agent-login-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          <p className="text-xs text-[#666666]">Un email de confirmation sera envoyé après mise à jour.</p>
          <button type="submit" className="rounded-full bg-[#E02020] px-4 py-2 text-sm text-white">Mettre à jour l&apos;email</button>
        </form>
        <form onSubmit={handlePassword} className="space-y-4 rounded-2xl border border-[#E8E3D8] bg-white p-6">
          <label className={labelClass} htmlFor="ap-pn">Modifier mon mot de passe</label>
          <input id="ap-pn" type="password" minLength={8} className={inputClass} value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} />
          <input id="ap-p2" type="password" className={inputClass} value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} placeholder="Confirmer le mot de passe" />
          <button type="submit" className="rounded-full bg-[#111111] px-4 py-2 text-sm text-white">Mettre à jour le mot de passe</button>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8 text-[#0F1923] dark:text-slate-100">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight dark:text-white" style={FONT_INTER}>
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-[#0F1923]/65 dark:text-slate-400">
          Informations publiques de votre agence et sécurité du compte.
        </p>
      </header>

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

      {formErr ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {formErr}
        </p>
      ) : null}

      <form id="agent-params-agence" onSubmit={handleSaveAgence} className="space-y-8">
        <Section icon={Building2} title="Informations générales">
          <div>
            <label className={labelClass} htmlFor="ap-nom">
              Nom de l&apos;agence *
            </label>
            <input id="ap-nom" className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} required />
            {fieldErrs.nom ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.nom}</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="ap-desc">
              Description
            </label>
            <textarea
              id="ap-desc"
              rows={4}
              className={`${inputClass} min-h-[100px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ap-adr">
              Adresse
            </label>
            <input id="ap-adr" className={inputClass} value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="ap-web">
              Site web
            </label>
            <input
              id="ap-web"
              type="url"
              placeholder="https://"
              className={inputClass}
              value={site_web}
              onChange={(e) => setSiteWeb(e.target.value)}
            />
            {fieldErrs.site_web ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.site_web}</p> : null}
          </div>
        </Section>

        <Section icon={Phone} title="Contact">
          <div>
            <label className={labelClass} htmlFor="ap-tel">
              Téléphone
            </label>
            <input id="ap-tel" className={inputClass} value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            {fieldErrs.telephone ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.telephone}</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="ap-wa">
              WhatsApp
            </label>
            <input
              id="ap-wa"
              className={inputClass}
              placeholder="+225 …"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            {fieldErrs.whatsapp ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.whatsapp}</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="ap-mail">
              Email de contact (public)
            </label>
            <input
              id="ap-mail"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrs.email ? <p className="mt-1 text-xs text-[#E53935]">{fieldErrs.email}</p> : null}
          </div>
        </Section>

        <Section icon={MapPin} title="Localisation">
          <div>
            <label className={labelClass} htmlFor="ap-ville">
              Ville / commune
            </label>
            <select id="ap-ville" className={inputClass} value={villeId} onChange={(e) => setVilleId(e.target.value)}>
              <option value="">Sélectionner une ville</option>
              {villes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="ap-quartier">
              Quartier / zone
            </label>
            <select id="ap-quartier" className={inputClass} value={quartier} onChange={(e) => setQuartier(e.target.value)}>
              <option value="">Selectionner un quartier</option>
              {quartiers.map((q) => (
                <option key={q.id} value={q.nom}>
                  {q.nom}
                </option>
              ))}
            </select>
            {villeId && quartiers.length === 0 ? <p className="mt-1 text-xs text-[#6B7280]">Aucun quartier disponible pour cette ville</p> : null}
          </div>
        </Section>

        <Section icon={Image} title="Logo">
          {logoUrl ? (
            <div className="flex flex-wrap items-end gap-4">
              <img src={logoUrl} alt="Logo agence" className="h-20 w-auto max-w-[200px] rounded-lg border object-contain" />
            </div>
          ) : (
            <p className="text-sm text-[#0F1923]/60 dark:text-slate-400">Aucun logo défini.</p>
          )}
          {logoPreview ? (
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-3">
              <p className="mb-2 text-xs text-[#6B7280]">Aperçu avant upload</p>
              <img src={logoPreview} alt="Aperçu logo" className="h-20 w-auto max-w-[200px] rounded-lg border object-contain" />
            </div>
          ) : null}
          <div>
            <label className={labelClass} htmlFor="ap-logo">
              Changer le logo
            </label>
            <input
              id="ap-logo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm"
              onChange={handleLogoChange}
              disabled={pending}
            />
            <p className="mt-1 text-xs text-[#0F1923]/50 dark:text-slate-500">JPG, PNG ou WEBP - max 2 Mo.</p>
            <button
              type="button"
              onClick={handleUploadLogo}
              disabled={!logoFile || pending}
              className="mt-2 rounded-full bg-[#111111] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? 'Upload en cours...' : 'Uploader le logo'}
            </button>
          </div>
        </Section>

        <Section icon={Phone} title="Coordonnées publiques">
          <label className="flex items-center justify-between rounded-lg border border-[#E5E5E5] px-3 py-2">
            <span>Afficher téléphone</span>
            <input type="checkbox" checked={showPhone} onChange={(e) => { setShowPhone(e.target.checked); toggleCoord('show_phone', e.target.checked) }} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-[#E5E5E5] px-3 py-2">
            <span>Afficher email</span>
            <input type="checkbox" checked={showEmail} onChange={(e) => { setShowEmail(e.target.checked); toggleCoord('show_email', e.target.checked) }} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-[#E5E5E5] px-3 py-2">
            <span>Afficher WhatsApp</span>
            <input type="checkbox" checked={showWhatsapp} onChange={(e) => { setShowWhatsapp(e.target.checked); toggleCoord('show_whatsapp', e.target.checked) }} />
          </label>
        </Section>

        <Section icon={Building2} title="Comptes de l'agence">
          <ul className="space-y-2">
            {comptesAgence.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-[#E5E5E5] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-[#111111]">{[c.prenom, c.nom].filter(Boolean).join(' ') || c.email}</p>
                  <p className="text-xs text-[#666666]">{c.email} · {c.statut}</p>
                </div>
                {!c.is_owner ? (
                  <button
                    type="button"
                    disabled={agentActionLoadingId === c.id}
                    onClick={async () => {
                      setAgentActionLoadingId(c.id)
                      await setStatutAgent(c.id, c.statut === 'actif' ? 'suspendu' : 'actif')
                      const { data } = await supabase.from('users').select('id, nom, prenom, email, statut, is_owner, created_at').eq('agence_id', agenceId).order('created_at', { ascending: true })
                      setComptesAgence(data ?? [])
                      setAgentActionLoadingId(null)
                    }}
                    className="rounded-lg border border-[#E02020] px-3 py-1.5 text-xs text-[#E02020] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {agentActionLoadingId === c.id ? 'Traitement...' : c.statut === 'actif' ? 'Suspendre' : 'Réactiver'}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      </form>

      <form onSubmit={handlePassword} className="space-y-4">
        <Section icon={KeyRound} title="Mot de passe du compte">
          <div>
            <label className={labelClass} htmlFor="ap-pc">
              Mot de passe actuel *
            </label>
            <input
              id="ap-pc"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              value={pwdCurrent}
              onChange={(e) => setPwdCurrent(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ap-pn">
              Nouveau mot de passe
            </label>
            <input
              id="ap-pn"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className={inputClass}
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ap-p2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="ap-p2"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={pwdConfirm}
              onChange={(e) => setPwdConfirm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[#0F1923] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1f2a37] disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {pending ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </Section>
      </form>

      <div className="sticky bottom-0 z-10 mt-8 flex justify-end border-t border-[#E8E3D8] bg-[#FAF6EF]/95 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
        <button
          type="submit"
          form="agent-params-agence"
          disabled={pending}
          className="rounded-full bg-[#E02020] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c81d1d] disabled:opacity-50"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}
