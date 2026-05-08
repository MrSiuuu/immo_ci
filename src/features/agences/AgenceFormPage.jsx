import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { creerAgence, creerCompteAgent, getAgenceById, modifierAgence } from './agencesService.js'

const inputClass =
  'w-full rounded-lg border border-[#E8E3D8] bg-white px-3 py-2.5 text-sm text-[#0F1923] focus:outline-none focus:ring-2 focus:ring-[#D97B00] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

/**
 * Création ou édition d’une agence (admin).
 */
export default function AgenceFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isCreate = !id

  const [loading, setLoading] = useState(!isCreate)
  const [loadErr, setLoadErr] = useState(null)

  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [site_web, setSiteWeb] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState('')

  const [compteEmail, setCompteEmail] = useState('')
  const [comptePassword, setComptePassword] = useState('')
  const [responsableNom, setResponsableNom] = useState('')
  const [responsablePrenom, setResponsablePrenom] = useState('')

  const [submitErr, setSubmitErr] = useState(null)
  const [pending, setPending] = useState(false)

  const [recap, setRecap] = useState(null)

  useEffect(() => {
    if (isCreate) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadErr(null)
      const row = await getAgenceById(id)
      if (cancelled) return
      if (!row) {
        setLoadErr('Agence introuvable.')
        setLoading(false)
        return
      }
      setNom(row.nom ?? '')
      setEmail(row.email ?? '')
      setWhatsapp(row.whatsapp ?? '')
      setTelephone(row.telephone ?? '')
      setAdresse(row.adresse ?? '')
      setVille(row.ville ?? '')
      setQuartier(row.quartier ?? '')
      setSiteWeb(row.site_web ?? '')
      setDescription(row.description ?? '')
      setLogo(row.logo ?? '')
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id, isCreate])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitErr(null)

    if (!nom.trim() || !email.trim() || !whatsapp.trim()) {
      setSubmitErr('Nom, email et WhatsApp sont obligatoires.')
      return
    }

    if (isCreate) {
      if (!compteEmail.trim() || !comptePassword.trim()) {
        setSubmitErr('Email et mot de passe du compte agent sont obligatoires.')
        return
      }
      if (comptePassword.length < 8) {
        setSubmitErr('Le mot de passe temporaire doit contenir au moins 8 caractères.')
        return
      }
    }

    setPending(true)

    const donnees = {
      nom: nom.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      telephone: telephone.trim() || null,
      adresse: adresse.trim() || null,
      ville: ville.trim() || null,
      quartier: quartier.trim() || null,
      site_web: site_web.trim() || null,
      description: description.trim() || null,
      logo: logo.trim() || null,
    }

    if (isCreate) {
      const { agence, error } = await creerAgence(donnees)
      if (error || !agence) {
        setSubmitErr(error ?? 'Création impossible.')
        setPending(false)
        return
      }

      const res = await creerCompteAgent({
        email: compteEmail.trim(),
        password: comptePassword,
        agence_id: agence.id,
        nom: responsableNom.trim() || null,
        prenom: responsablePrenom.trim() || null,
      })

      if (!res.success) {
        setRecap({
          agenceId: agence.id,
          agenceNom: agence.nom,
          compteError: res.error ?? 'Erreur inconnue',
        })
        setPending(false)
        return
      }

      setRecap({
        agenceId: agence.id,
        agenceNom: agence.nom,
        email: compteEmail.trim(),
        password: comptePassword,
        compteError: null,
      })
      setPending(false)
      return
    }

    const { error } = await modifierAgence(id, donnees)
    setPending(false)
    if (error) {
      setSubmitErr(error)
      return
    }
    navigate(`/admin/agences/${id}`)
  }

  async function copyAccess() {
    if (!recap?.email) return
    const text = `Email : ${recap.email}\nMot de passe temporaire : ${recap.password}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  if (!isCreate && loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#0F1923]/70 dark:text-slate-400">
        Chargement…
      </div>
    )
  }

  if (!isCreate && loadErr) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {loadErr}
      </div>
    )
  }

  if (recap) {
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-[#E8E3D8] bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1
          className="text-xl font-semibold text-[#0F1923] dark:text-white"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          {recap.compteError ? 'Agence créée - compte agent en erreur' : 'Agence créée avec succès'}
        </h1>

        {recap.compteError ? (
          <div className="rounded-lg border border-amber-200 bg-[#FAEEDA] px-4 py-3 text-sm text-[#854F0B]">
            <p className="font-medium">L&apos;agence « {recap.agenceNom} » est enregistrée.</p>
            <p className="mt-2">
              Erreur compte agent : <strong>{recap.compteError}</strong>
            </p>
            <p className="mt-2 text-xs">Vous pouvez créer le compte depuis la fiche agence.</p>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-[#E8E3D8] bg-[#FAF6EF] p-4 text-sm text-[#0F1923] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            <p className="font-semibold text-[#1D9E75]">Accès à transmettre à l&apos;agence :</p>
            <p>
              <strong>Email :</strong> {recap.email}
            </p>
            <p>
              <strong>Mot de passe temporaire :</strong> {recap.password}
            </p>
            <p className="text-xs text-[#854F0B]">
              L&apos;agent devra changer son mot de passe à la première connexion.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!recap.compteError ? (
            <button
              type="button"
              onClick={copyAccess}
              className="rounded-lg bg-[#D97B00] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#c26a00]"
            >
              Copier les accès
            </button>
          ) : null}
          <Link
            to={`/admin/agences/${recap.agenceId}`}
            className="rounded-lg border border-[#D97B00] px-4 py-2.5 text-sm font-medium text-[#D97B00] hover:bg-[#D97B00]/10"
          >
            Voir l&apos;agence
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight text-[#0F1923] dark:text-white"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          {isCreate ? 'Nouvelle agence' : 'Modifier l’agence'}
        </h1>
        <p className="mt-1 text-sm text-[#0F1923]/65 dark:text-slate-400">
          {isCreate ? 'Créez la fiche partenaire puis le compte agent.' : 'Mettez à jour les informations affichées.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F1923]/50 dark:text-slate-500">
            Fiche agence
          </h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Nom *</label>
            <input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Email *</label>
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">WhatsApp *</label>
            <input className={inputClass} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Téléphone</label>
            <input className={inputClass} value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Adresse</label>
            <input className={inputClass} value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Ville</label>
              <input className={inputClass} value={ville} onChange={(e) => setVille(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Quartier</label>
              <input className={inputClass} value={quartier} onChange={(e) => setQuartier(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Site web</label>
            <input className={inputClass} value={site_web} onChange={(e) => setSiteWeb(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Logo (URL)</label>
            <input className={inputClass} value={logo} onChange={(e) => setLogo(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Description</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </section>

        {isCreate ? (
          <section className="space-y-4 border-t border-[#E8E3D8] pt-6 dark:border-slate-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F1923]/50 dark:text-slate-500">
              Compte de connexion (agent)
            </h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Email du compte *</label>
              <input
                className={inputClass}
                type="email"
                value={compteEmail}
                onChange={(e) => setCompteEmail(e.target.value)}
                required={isCreate}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">
                Mot de passe temporaire * (min. 8 caractères)
              </label>
              <input
                className={inputClass}
                type="password"
                autoComplete="new-password"
                value={comptePassword}
                onChange={(e) => setComptePassword(e.target.value)}
                required={isCreate}
                minLength={8}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Nom du responsable</label>
                <input className={inputClass} value={responsableNom} onChange={(e) => setResponsableNom(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Prénom</label>
                <input
                  className={inputClass}
                  value={responsablePrenom}
                  onChange={(e) => setResponsablePrenom(e.target.value)}
                />
              </div>
            </div>
          </section>
        ) : null}

        {submitErr && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200" role="alert">
            {submitErr}
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-[#E8E3D8] pt-6 dark:border-slate-700">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#D97B00] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#c26a00] disabled:opacity-60"
          >
            {pending ? 'Enregistrement…' : isCreate ? 'Créer l’agence et le compte' : 'Enregistrer'}
          </button>
          <Link
            to={isCreate ? '/admin/agences' : `/admin/agences/${id}`}
            className="rounded-lg border border-[#E8E3D8] px-5 py-2.5 text-sm font-medium text-[#0F1923] hover:bg-[#FAF6EF] dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
