import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react'
import { useUser } from '../../../hooks/useUser.js'
import {
  chargerDonneesReference,
  chargerQuartiers,
  creerAnnonce,
  enregistrerPhotos,
  getOrCreateNestymoAdminAgency,
  uploadPhoto,
} from '../annoncesService.js'
import { TRANSACTION_OPTIONS } from './formTypesConfig.js'

function buildInitialEquipements(config) {
  return Object.fromEntries(
    config.equipements.map((field) => [field.key, field.type === 'checkbox' ? false : '']),
  )
}

function toNumOrNull(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function fileToPreview(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    preview: URL.createObjectURL(file),
  }
}

export default function TypeAnnonceFormPage({ config }) {
  const navigate = useNavigate()
  const { role, agenceId } = useUser()
  const routeBase = role === 'agent' ? '/agence' : '/admin'

  const [step, setStep] = useState(1)
  const [refs, setRefs] = useState({ typesBiens: [], villes: [], agences: [] })
  const [quartiers, setQuartiers] = useState([])
  const [photos, setPhotos] = useState([])
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [errs, setErrs] = useState({})

  const [form, setForm] = useState({
    titre: '',
    transaction: '',
    prix: '',
    statut: 'brouillon',
    surface: '',
    chambres: '',
    salles_de_bain: '',
    description: '',
    ville_id: '',
    quartier_id: '',
    adresse: '',
    latitude: '',
    longitude: '',
    nombre_etages: '',
    nombre_lots: '',
    equipements: buildInitialEquipements(config),
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await chargerDonneesReference()
      if (!cancelled) setRefs(data)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const typeBienId = useMemo(
    () => refs.typesBiens.find((t) => t.nom === config.typeName)?.id ?? '',
    [refs.typesBiens, config.typeName],
  )

  async function onVilleChange(villeId) {
    setForm((p) => ({ ...p, ville_id: villeId, quartier_id: '' }))
    setQuartiers([])
    if (!villeId) return
    const q = await chargerQuartiers(villeId)
    setQuartiers(q)
  }

  function setValue(key, value) {
    setErrs((p) => ({ ...p, [key]: undefined }))
    setForm((p) => ({ ...p, [key]: value }))
  }

  function toggleEquip(key) {
    setForm((p) => ({ ...p, equipements: { ...p.equipements, [key]: !p.equipements[key] } }))
  }

  function validateStep() {
    const next = {}
    const numericRules = config.numericRules ?? {}
    if (step === 1) {
      if (!form.titre.trim()) {
        next.titre = 'Titre obligatoire'
      } else if (form.titre.trim().length < 5) {
        next.titre = 'Le titre doit contenir au moins 5 caracteres'
      }
      if (!form.transaction) next.transaction = 'Transaction obligatoire'
      if (!form.prix || Number(form.prix) < 0) next.prix = 'Prix invalide'
    }
    if (step === 2) {
      if (config.required.surface && !form.surface) next.surface = 'Surface obligatoire'
      if (config.required.chambres && !form.chambres) next.chambres = 'Chambres obligatoires'
      if (config.required.salles_de_bain && !form.salles_de_bain) next.salles_de_bain = 'Salles de bain obligatoires'
      if (form.surface !== '' && numericRules.surface != null && Number(form.surface) < numericRules.surface) {
        next.surface = `La valeur minimale est ${numericRules.surface}`
      }
      if (form.chambres !== '' && numericRules.chambres != null && Number(form.chambres) < numericRules.chambres) {
        next.chambres = `La valeur minimale est ${numericRules.chambres}`
      }
      if (
        form.salles_de_bain !== '' &&
        numericRules.salles_de_bain != null &&
        Number(form.salles_de_bain) < numericRules.salles_de_bain
      ) {
        next.salles_de_bain = `La valeur minimale est ${numericRules.salles_de_bain}`
      }

      for (const eq of config.equipements) {
        if (eq.type === 'checkbox') continue
        const raw = form.equipements?.[eq.key]
        if (eq.required && (raw === '' || raw == null)) {
          next[eq.key] = 'Ce champ est obligatoire'
          continue
        }
        if (eq.type === 'number' && raw !== '' && raw != null) {
          const n = Number(raw)
          if (!Number.isFinite(n)) {
            next[eq.key] = 'Valeur invalide'
            continue
          }
          if (eq.min != null && n < eq.min) {
            next[eq.key] = `La valeur minimale est ${eq.min}`
          }
        }
        if (eq.type === 'select' && eq.required && !raw) {
          next[eq.key] = 'Ce champ est obligatoire'
        }
      }
    }
    if (step === 3) {
      if (!form.ville_id) next.ville_id = 'Ville obligatoire'
    }
    if (step === 4 && photos.length < 1) next.photos = 'Ajoutez au moins une photo'
    setErrs(next)
    return Object.keys(next).length === 0
  }

  async function submitWithStatut(statut) {
    setLoading(true)
    setError(null)
    try {
      if (statut === 'publie' && photos.length < 2) {
        setErrs((p) => ({ ...p, photos: 'Ajoutez au moins 2 photos pour publier votre annonce' }))
        setLoading(false)
        return
      }

      let agence_id = null
      if (role === 'agent') {
        agence_id = agenceId
      } else {
        const { agenceId: adminAgenceId, error: adminAgenceErr } = await getOrCreateNestymoAdminAgency()
        if (adminAgenceErr || !adminAgenceId) {
          throw adminAgenceErr ?? new Error('Impossible de recuperer l agence admin')
        }
        agence_id = adminAgenceId
      }
      const equipements = {}
      for (const eq of config.equipements) {
        const raw = form.equipements?.[eq.key]
        if (eq.type === 'checkbox') {
          if (raw === true) {
            equipements[eq.key] = true
          }
          continue
        }
        if (eq.type === 'number') {
          if (raw === '' || raw == null) continue
          const n = Number(raw)
          if (Number.isFinite(n)) {
            equipements[eq.key] = n
          }
          continue
        }
        if (eq.type === 'text' || eq.type === 'select') {
          const value = typeof raw === 'string' ? raw.trim() : raw
          if (value === '' || value == null) continue
          equipements[eq.key] = String(value)
        }
      }

      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        type_bien_id: typeBienId,
        transaction: form.transaction,
        prix: Number(form.prix),
        surface: config.fields.surface ? toNumOrNull(form.surface) : null,
        chambres:
          config.fields.chambres && !config.impliedValues?.chambres
            ? toNumOrNull(form.chambres)
            : (config.impliedValues?.chambres ?? null),
        salles_de_bain: config.fields.salles_de_bain ? toNumOrNull(form.salles_de_bain) : null,
        ville_id: form.ville_id,
        quartier_id: form.quartier_id || null,
        adresse: form.adresse.trim() || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        agence_id,
        statut,
        equipements,
      }

      const { annonce, error: createErr } = await creerAnnonce(payload)
      if (createErr) throw createErr

      const uploaded = []
      for (let i = 0; i < photos.length; i += 1) {
        const p = photos[i]
        const { url, error: upErr } = await uploadPhoto(p.file, agence_id, annonce.id)
        if (upErr) throw upErr
        uploaded.push({ url, ordre: i, is_principale: i === 0 })
      }
      if (uploaded.length > 0) {
        const { error: photoErr } = await enregistrerPhotos(uploaded, annonce.id)
        if (photoErr) throw photoErr
      }
      navigate(`${routeBase}/annonces`)
    } catch (e) {
      setError(e?.message ?? "Erreur lors de l'enregistrement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-[#E5E7EB] bg-white p-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: '"Inter", sans-serif' }}>
          Formulaire {config.label}
        </h1>
        <p className="text-sm text-[#6B7280]">Étape {step}/4</p>
      </header>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Titre *</label>
            <input className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2" placeholder={config.titlePlaceholder ?? ''} value={form.titre} onChange={(e) => setValue('titre', e.target.value)} />
            {errs.titre && <p className="mt-1 text-xs text-[#E53935]">{errs.titre}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Transaction *</label>
            <select className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2" value={form.transaction} onChange={(e) => setValue('transaction', e.target.value)}>
              <option value="">- Sélectionner -</option>
              {TRANSACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {errs.transaction && <p className="mt-1 text-xs text-[#E53935]">{errs.transaction}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Prix (FCFA) *</label>
            <input type="number" min={0} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2" value={form.prix} onChange={(e) => setValue('prix', e.target.value)} />
            {errs.prix && <p className="mt-1 text-xs text-[#E53935]">{errs.prix}</p>}
          </div>
          {role !== 'agent' ? (
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F5F7FA] px-3 py-2 text-sm text-[#6B7280]">
              Les annonces admin sont rattachees automatiquement a l agence systeme Nestymo Admin.
            </div>
          ) : null}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {config.fields.surface && (
            <div>
              <label className="mb-1 block text-sm font-medium">Surface (m²){config.required.surface ? ' *' : ''}</label>
              <input type="number" min={config.numericRules?.surface ?? 0} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 focus:border-[#E02020] focus:outline-none" value={form.surface} onChange={(e) => setValue('surface', e.target.value)} />
              {errs.surface && <p className="mt-1 text-xs text-[#E53935]">{errs.surface}</p>}
            </div>
          )}
          {config.fields.chambres && (
            <div>
              <label className="mb-1 block text-sm font-medium">Chambres{config.required.chambres ? ' *' : ''}</label>
              <input type="number" min={config.numericRules?.chambres ?? 0} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 focus:border-[#E02020] focus:outline-none" value={form.chambres} onChange={(e) => setValue('chambres', e.target.value)} />
              {errs.chambres && <p className="mt-1 text-xs text-[#E53935]">{errs.chambres}</p>}
            </div>
          )}
          {config.fields.salles_de_bain && (
            <div>
              <label className="mb-1 block text-sm font-medium">Salles de bain{config.required.salles_de_bain ? ' *' : ''}</label>
              <input type="number" min={config.numericRules?.salles_de_bain ?? 0} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 focus:border-[#E02020] focus:outline-none" value={form.salles_de_bain} onChange={(e) => setValue('salles_de_bain', e.target.value)} />
              {errs.salles_de_bain && <p className="mt-1 text-xs text-[#E53935]">{errs.salles_de_bain}</p>}
            </div>
          )}
          {config.equipements
            .filter((eq) => eq.type !== 'checkbox')
            .map((eq) => (
              <div key={eq.key}>
                <label className="mb-1 block text-sm font-medium">
                  {eq.label}{eq.required ? ' *' : ''}
                </label>
                {eq.type === 'number' ? (
                  <div className="relative">
                    <input
                      type="number"
                      min={eq.min ?? 0}
                      placeholder={eq.placeholder ?? ''}
                      className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 pr-16 focus:border-[#E02020] focus:outline-none"
                      value={form.equipements?.[eq.key] ?? ''}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          equipements: { ...p.equipements, [eq.key]: e.target.value },
                        }))}
                    />
                    {eq.unit ? (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280]">
                        {eq.unit}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {eq.type === 'text' ? (
                  <input
                    type="text"
                    placeholder={eq.placeholder ?? ''}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 focus:border-[#E02020] focus:outline-none"
                    value={form.equipements?.[eq.key] ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        equipements: { ...p.equipements, [eq.key]: e.target.value },
                      }))}
                  />
                ) : null}
                {eq.type === 'select' ? (
                  <select
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 focus:border-[#E02020] focus:outline-none"
                    value={form.equipements?.[eq.key] ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        equipements: { ...p.equipements, [eq.key]: e.target.value },
                      }))}
                  >
                    <option value="" disabled>
                      Selectionner...
                    </option>
                    {(eq.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                {errs[eq.key] && <p className="mt-1 text-xs text-[#E53935]">{errs[eq.key]}</p>}
              </div>
            ))}
          {config.fields.description && (
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea rows={4} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2" value={form.description} onChange={(e) => setValue('description', e.target.value)} />
            </div>
          )}

          {Object.entries(
            config.equipements
              .filter((eq) => eq.type === 'checkbox')
              .reduce((acc, eq) => {
                const key = eq.group ?? 'Equipements'
                acc[key] = acc[key] ?? []
                acc[key].push(eq)
                return acc
              }, {}),
          ).map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-sm font-medium">{group}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((eq) => (
                  <label key={eq.key} className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                    <input
                      type="checkbox"
                      className="accent-[#E02020]"
                      checked={!!form.equipements[eq.key]}
                      onChange={() => toggleEquip(eq.key)}
                    />
                    {eq.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Ville *</label>
            <select className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2" value={form.ville_id} onChange={(e) => onVilleChange(e.target.value)}>
              <option value="">- Sélectionner -</option>
              {refs.villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
            </select>
            {errs.ville_id && <p className="mt-1 text-xs text-[#E53935]">{errs.ville_id}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Quartier</label>
            <select className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2" value={form.quartier_id} onChange={(e) => setValue('quartier_id', e.target.value)}>
              <option value="">- Selectionner -</option>
              {quartiers.map((q) => <option key={q.id} value={q.id}>{q.nom}</option>)}
            </select>
            {form.ville_id && quartiers.length === 0 ? (
              <p className="mt-1 text-xs text-[#6B7280]">Aucun quartier disponible pour cette ville</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Adresse</label>
            <input className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2" placeholder={config.addressPlaceholder ?? 'Ex: Rue 12, Residence Les Acacias, Cocody'} value={form.adresse} onChange={(e) => setValue('adresse', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Latitude</label>
              <input type="number" step="any" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2" value={form.latitude} onChange={(e) => setValue('latitude', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Longitude</label>
              <input type="number" step="any" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2" value={form.longitude} onChange={(e) => setValue('longitude', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Photos *</label>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              const valid = files.filter((f) => f.size <= 5 * 1024 * 1024)
              if (valid.length < files.length) {
                setErrs((p) => ({ ...p, photos: 'Certaines photos depassent 5 Mo et ont ete ignorees' }))
              }
              setPhotos((prev) => [...prev, ...valid.map(fileToPreview)])
              e.target.value = ''
            }} />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
              }}
              className="cursor-pointer rounded-lg border-2 border-dashed border-[#E5E7EB] bg-white p-6 text-center transition hover:border-[#E02020] hover:bg-[#FFF5F5]"
            >
              <ImagePlus className="mx-auto h-8 w-8 text-[#E02020]" />
              <p className="mt-2 text-sm font-medium text-[#1A1A1A]">Glissez vos photos ici ou cliquez pour selectionner</p>
              <p className="mt-1 text-xs text-[#6B7280]">JPG, PNG, WEBP - Max 5 Mo par photo - Min 2 photos</p>
            </div>
            {photos.length > 0 ? (
              <div className="mt-3">
                <p className={`mb-2 text-sm ${photos.length < 2 ? 'text-[#E53935]' : 'text-[#6B7280]'}`}>
                  {photos.length} photo(s) selectionnee(s)
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((p, idx) => (
                    <div key={p.id} className="relative rounded-lg border border-[#E5E7EB]">
                      <img src={p.preview} alt="" className="h-[120px] w-full rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(p.preview)
                          setPhotos((prev) => prev.filter((x) => x.id !== p.id))
                        }}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {idx === 0 ? <span className="absolute left-1 top-1 rounded-full bg-[#E02020] px-2 py-0.5 text-[10px] text-white">Principale</span> : null}
                      <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                        <button type="button" disabled={idx === 0} onClick={() => setPhotos((prev) => {
                          const next = [...prev]
                          if (idx > 0) [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                          return next
                        })} className="rounded bg-black/60 p-1 text-white disabled:opacity-30"><ChevronLeft className="h-3 w-3" /></button>
                        <button type="button" disabled={idx === photos.length - 1} onClick={() => setPhotos((prev) => {
                          const next = [...prev]
                          if (idx < next.length - 1) [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
                          return next
                        })} className="rounded bg-black/60 p-1 text-white disabled:opacity-30"><ChevronRight className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {errs.photos && <p className="mt-1 text-xs text-[#E53935]">{errs.photos}</p>}
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-[#F5F7FA] p-4 text-sm text-[#6B7280]">
            <p className="font-medium text-[#1A1A1A]">Récapitulatif</p>
            <p>Type : {config.label}</p>
            <p>Titre : {form.titre || '-'}</p>
            <p>Transaction : {form.transaction || '-'}</p>
            <p>Prix : {form.prix || '-'} FCFA</p>
            <p>Photos : {photos.length}</p>
          </div>
          {error ? (
            <p className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]">{error}</p>
          ) : null}
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate(`${routeBase}/annonces/new`))}
          className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#1A1A1A]"
        >
          {step > 1 ? 'Précédent' : 'Retour'}
        </button>

        <div className="flex gap-2">
          {step < 4 ? (
            <button
              type="button"
              onClick={() => validateStep() && setStep((s) => s + 1)}
              className="rounded-full bg-[#E02020] px-5 py-2 text-sm font-semibold text-white hover:bg-[#C01818]"
            >
              Suivant
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => validateStep() && submitWithStatut('brouillon')}
                className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A]"
              >
                Enregistrer en brouillon
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => validateStep() && submitWithStatut('publie')}
                className="rounded-full bg-[#E02020] px-5 py-2 text-sm font-semibold text-white hover:bg-[#C01818]"
              >
                {loading ? 'Enregistrement...' : 'Publier'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
