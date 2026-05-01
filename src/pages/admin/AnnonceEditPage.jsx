import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser.js'
import { FORM_TYPE_CONFIG, TRANSACTION_OPTIONS } from '../../features/annonces/forms/formTypesConfig.js'
import { chargerQuartiers, uploadPhoto } from '../../features/annonces/annoncesService.js'
const STATUT_OPTIONS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'publie', label: 'Publie' },
  { value: 'reserve', label: 'Reserve' },
  { value: 'vendu', label: 'Vendu' },
  { value: 'loue', label: 'Loue' },
]

const inputClass = 'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#E02020] focus:outline-none'

function toNumOrNull(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function extractPathFromPublicUrl(url) {
  if (!url) return null
  const marker = '/storage/v1/object/public/annonces-photos/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

function fileWithPreview(file) {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    preview: URL.createObjectURL(file),
  }
}

export default function AnnonceEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role, agence } = useUser()
  const routeBase = role === 'agent' ? '/agence' : '/admin'
  const canPublishStatut = role !== 'agent' || agence?.verification_status === 'verified'
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [annonceAgenceId, setAnnonceAgenceId] = useState(null)
  const [refs, setRefs] = useState({ typesBiens: [], villes: [] })
  const [quartiers, setQuartiers] = useState([])
  const [existingPhotos, setExistingPhotos] = useState([])
  const [newPhotos, setNewPhotos] = useState([])
  const [removedPhotoIds, setRemovedPhotoIds] = useState([])
  const [form, setForm] = useState({
    titre: '',
    transaction: '',
    prix: '',
    statut: 'brouillon',
    type_bien_id: '',
    description: '',
    surface: '',
    chambres: '',
    salles_de_bain: '',
    ville_id: '',
    quartier_id: '',
    adresse: '',
    latitude: '',
    longitude: '',
    equipements: {},
  })

  const typeName = useMemo(
    () => refs.typesBiens.find((t) => t.id === form.type_bien_id)?.nom ?? null,
    [refs.typesBiens, form.type_bien_id],
  )
  const config = useMemo(
    () => Object.values(FORM_TYPE_CONFIG).find((cfg) => cfg.typeName === typeName) ?? null,
    [typeName],
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [typesRes, villesRes, annonceRes, photosRes] = await Promise.all([
        supabase.from('types_biens').select('id, nom').order('nom'),
        supabase.from('villes').select('id, nom').order('nom'),
        supabase.from('annonces').select('*').eq('id', id).single(),
        supabase.from('photos').select('id, url, ordre, is_principale').eq('annonce_id', id).order('ordre', { ascending: true }),
      ])

      if (cancelled) return
      if (annonceRes.error || !annonceRes.data) {
        setError(annonceRes.error?.message ?? 'Annonce introuvable')
        setLoading(false)
        return
      }
      setRefs({ typesBiens: typesRes.data ?? [], villes: villesRes.data ?? [] })
      const a = annonceRes.data
      setAnnonceAgenceId(a.agence_id ?? null)
      setForm({
        titre: a.titre ?? '',
        transaction: a.transaction ?? '',
        prix: a.prix != null ? String(a.prix) : '',
        statut: a.statut ?? 'brouillon',
        type_bien_id: a.type_bien_id ?? '',
        description: a.description ?? '',
        surface: a.surface != null ? String(a.surface) : '',
        chambres: a.chambres != null ? String(a.chambres) : '',
        salles_de_bain: a.salles_de_bain != null ? String(a.salles_de_bain) : '',
        ville_id: a.ville_id ?? '',
        quartier_id: a.quartier_id ?? '',
        adresse: a.adresse ?? '',
        latitude: a.latitude != null ? String(a.latitude) : '',
        longitude: a.longitude != null ? String(a.longitude) : '',
        equipements: a.equipements && typeof a.equipements === 'object' ? a.equipements : {},
      })
      setExistingPhotos(photosRes.data ?? [])
      if (a.ville_id) {
        const q = await chargerQuartiers(a.ville_id)
        if (!cancelled) setQuartiers(q)
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  async function onVilleChange(villeId) {
    setForm((p) => ({ ...p, ville_id: villeId, quartier_id: '' }))
    const q = villeId ? await chargerQuartiers(villeId) : []
    setQuartiers(q)
  }

  function setEq(key, value) {
    setForm((p) => ({ ...p, equipements: { ...p.equipements, [key]: value } }))
  }

  function allPhotosCount() {
    return existingPhotos.length + newPhotos.length
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(null)
    if (form.titre.trim().length < 5) {
      setError('Le titre doit contenir au moins 5 caracteres')
      return
    }
    if (form.statut === 'publie' && allPhotosCount() < 1) {
      setError('Ajoutez au moins 1 photo pour publier votre annonce')
      return
    }
    if (form.statut === 'publie' && !canPublishStatut) {
      setError("Votre agence doit etre verifiee avant publication")
      return
    }
    setSaving(true)

    try {
      const equipements = {}
      for (const eq of config?.equipements ?? []) {
        const raw = form.equipements?.[eq.key]
        if (eq.type === 'checkbox') {
          if (raw === true) equipements[eq.key] = true
        } else if (eq.type === 'number') {
          if (raw !== '' && raw != null) {
            const n = Number(raw)
            if (Number.isFinite(n)) equipements[eq.key] = n
          }
        } else if (eq.type === 'text' || eq.type === 'select') {
          const value = typeof raw === 'string' ? raw.trim() : raw
          if (value !== '' && value != null) equipements[eq.key] = String(value)
        }
      }

      const { error: updErr } = await supabase
        .from('annonces')
        .update({
          titre: form.titre.trim(),
          transaction: form.transaction || null,
          prix: Number(form.prix),
          statut: form.statut,
          description: form.description.trim() || null,
          surface: config?.fields.surface ? toNumOrNull(form.surface) : null,
          chambres: config?.fields.chambres ? toNumOrNull(form.chambres) : (config?.impliedValues?.chambres ?? null),
          salles_de_bain: config?.fields.salles_de_bain ? toNumOrNull(form.salles_de_bain) : null,
          ville_id: form.ville_id || null,
          quartier_id: form.quartier_id || null,
          adresse: form.adresse.trim() || null,
          latitude: toNumOrNull(form.latitude),
          longitude: toNumOrNull(form.longitude),
          equipements,
        })
        .eq('id', id)
      if (updErr) throw updErr

      const removedPhotos = existingPhotos.filter((p) => removedPhotoIds.includes(p.id))
      for (const photo of removedPhotos) {
        const path = extractPathFromPublicUrl(photo.url)
        if (path) await supabase.storage.from('annonces-photos').remove([path])
        await supabase.from('photos').delete().eq('id', photo.id)
      }

      const keptPhotos = existingPhotos.filter((p) => !removedPhotoIds.includes(p.id))
      const uploadedRows = []
      for (const item of newPhotos) {
        const { url, error: upErr } = await uploadPhoto(item.file, annonceAgenceId ?? agence?.id, id)
        if (upErr) throw upErr
        uploadedRows.push({ url, ordre: 0, is_principale: false })
      }

      const ordered = [...keptPhotos, ...uploadedRows]
      for (let i = 0; i < ordered.length; i += 1) {
        const isPrincipale = i === 0
        if ('id' in ordered[i]) {
          await supabase.from('photos').update({ ordre: i, is_principale: isPrincipale }).eq('id', ordered[i].id)
        } else {
          await supabase.from('photos').insert({ annonce_id: id, url: ordered[i].url, ordre: i, is_principale: isPrincipale })
        }
      }
      navigate(`${routeBase}/annonces/${id}`)
    } catch (err) {
      setError(err?.message ?? 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAnnonce() {
    const { error: delErr } = await supabase.from('annonces').delete().eq('id', id)
    if (delErr) {
      setError(delErr.message)
      return
    }
    navigate(`${routeBase}/annonces`)
  }

  if (loading) return <p className="text-sm text-[#6B7280]">Chargement...</p>
  if (error && !form.type_bien_id) return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#E53935]">{error}</p>

  return (
    <div className="space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-6">
      <h1 className="text-2xl font-semibold text-[#1A1A1A]">Modifier l annonce</h1>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#E53935]">{error}</p> : null}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium">Titre *</label><input className={inputClass} value={form.titre} onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))} /></div>
          <div><label className="mb-1 block text-sm font-medium">Prix *</label><input type="number" min={0} className={inputClass} value={form.prix} onChange={(e) => setForm((p) => ({ ...p, prix: e.target.value }))} /></div>
          <div><label className="mb-1 block text-sm font-medium">Transaction *</label><select className={inputClass} value={form.transaction} onChange={(e) => setForm((p) => ({ ...p, transaction: e.target.value }))}><option value="">Selectionner...</option>{TRANSACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-medium">Statut *</label><select className={inputClass} value={form.statut} onChange={(e) => setForm((p) => ({ ...p, statut: e.target.value }))}>{STATUT_OPTIONS.map((o) => <option key={o.value} value={o.value} disabled={o.value === 'publie' && !canPublishStatut}>{o.label}</option>)}</select></div>
        </div>
        <div><label className="mb-1 block text-sm font-medium">Description</label><textarea rows={4} className={inputClass} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {config?.fields.surface ? <div><label className="mb-1 block text-sm font-medium">Surface</label><input type="number" min={0} className={inputClass} value={form.surface} onChange={(e) => setForm((p) => ({ ...p, surface: e.target.value }))} /></div> : null}
          {config?.fields.chambres ? <div><label className="mb-1 block text-sm font-medium">Chambres</label><input type="number" min={0} className={inputClass} value={form.chambres} onChange={(e) => setForm((p) => ({ ...p, chambres: e.target.value }))} /></div> : null}
          {config?.fields.salles_de_bain ? <div><label className="mb-1 block text-sm font-medium">Salles de bain</label><input type="number" min={0} className={inputClass} value={form.salles_de_bain} onChange={(e) => setForm((p) => ({ ...p, salles_de_bain: e.target.value }))} /></div> : null}
          {(config?.equipements ?? []).filter((eq) => eq.type !== 'checkbox').map((eq) => (
            <div key={eq.key}>
              <label className="mb-1 block text-sm font-medium">{eq.label}{eq.required ? ' *' : ''}</label>
              {eq.type === 'number' ? <input type="number" min={eq.min ?? 0} className={inputClass} value={form.equipements?.[eq.key] ?? ''} onChange={(e) => setEq(eq.key, e.target.value)} /> : null}
              {eq.type === 'text' ? <input type="text" className={inputClass} value={form.equipements?.[eq.key] ?? ''} onChange={(e) => setEq(eq.key, e.target.value)} /> : null}
              {eq.type === 'select' ? <select className={inputClass} value={form.equipements?.[eq.key] ?? ''} onChange={(e) => setEq(eq.key, e.target.value)}><option value="">Selectionner...</option>{(eq.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : null}
            </div>
          ))}
        </div>

        {(config?.equipements ?? []).some((eq) => eq.type === 'checkbox') ? (
          <div>
            <p className="mb-2 text-sm font-medium">Equipements</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(config?.equipements ?? []).filter((eq) => eq.type === 'checkbox').map((eq) => (
                <label key={eq.key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-[#E02020]" checked={!!form.equipements?.[eq.key]} onChange={(e) => setEq(eq.key, e.target.checked)} />
                  {eq.label}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium">Ville</label><select className={inputClass} value={form.ville_id ?? ''} onChange={(e) => onVilleChange(e.target.value)}><option value="">Selectionner...</option>{refs.villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-medium">Quartier</label><select className={inputClass} value={form.quartier_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, quartier_id: e.target.value }))}><option value="">Selectionner...</option>{quartiers.map((q) => <option key={q.id} value={q.id}>{q.nom}</option>)}</select></div>
          <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium">Adresse</label><input className={inputClass} value={form.adresse} onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))} /></div>
          <div><label className="mb-1 block text-sm font-medium">Latitude</label><input type="number" step="any" className={inputClass} value={form.latitude} onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))} /></div>
          <div><label className="mb-1 block text-sm font-medium">Longitude</label><input type="number" step="any" className={inputClass} value={form.longitude} onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))} /></div>
        </div>

        <section className="space-y-3 rounded-lg border border-[#E5E7EB] p-4">
          <p className="text-sm font-medium">Photos</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {existingPhotos.map((p, idx) => (
              <div key={p.id} className="relative rounded-lg border border-[#E5E7EB]">
                <img src={p.url} alt="" className="h-[120px] w-full rounded-lg object-cover" />
                {idx === 0 ? <span className="absolute left-1 top-1 rounded-full bg-[#E02020] px-2 py-0.5 text-[10px] text-white">Principale</span> : null}
                <button type="button" onClick={() => {
                  setRemovedPhotoIds((prev) => [...prev, p.id])
                  setExistingPhotos((prev) => prev.filter((x) => x.id !== p.id))
                }} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><X className="h-3 w-3" /></button>
                <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                  <button type="button" disabled={idx === 0} onClick={() => setExistingPhotos((prev) => {
                    const next = [...prev]
                    if (idx > 0) [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                    return next
                  })} className="rounded bg-black/60 p-1 text-white disabled:opacity-30"><ChevronLeft className="h-3 w-3" /></button>
                  <button type="button" disabled={idx === existingPhotos.length - 1} onClick={() => setExistingPhotos((prev) => {
                    const next = [...prev]
                    if (idx < next.length - 1) [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
                    return next
                  })} className="rounded bg-black/60 p-1 text-white disabled:opacity-30"><ChevronRight className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
            {newPhotos.map((p, idx) => (
              <div key={p.id} className="relative rounded-lg border border-[#E5E7EB]">
                <img src={p.preview} alt="" className="h-[120px] w-full rounded-lg object-cover" />
                <button type="button" onClick={() => {
                  URL.revokeObjectURL(p.preview)
                  setNewPhotos((prev) => prev.filter((x) => x.id !== p.id))
                }} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><X className="h-3 w-3" /></button>
                <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                  <button type="button" disabled={idx === 0} onClick={() => setNewPhotos((prev) => {
                    const next = [...prev]
                    if (idx > 0) [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                    return next
                  })} className="rounded bg-black/60 p-1 text-white disabled:opacity-30"><ChevronLeft className="h-3 w-3" /></button>
                  <button type="button" disabled={idx === newPhotos.length - 1} onClick={() => setNewPhotos((prev) => {
                    const next = [...prev]
                    if (idx < next.length - 1) [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
                    return next
                  })} className="rounded bg-black/60 p-1 text-white disabled:opacity-30"><ChevronRight className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
            const files = Array.from(e.target.files ?? []).filter((f) => f.size <= 5 * 1024 * 1024)
            setNewPhotos((prev) => [...prev, ...files.map(fileWithPreview)])
            e.target.value = ''
          }} />
          <div role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }} className="cursor-pointer rounded-lg border-2 border-dashed border-[#E5E7EB] p-4 text-center hover:border-[#E02020] hover:bg-[#FFF5F5]">
            <ImagePlus className="mx-auto h-6 w-6 text-[#E02020]" />
            <p className="mt-1 text-sm text-[#1A1A1A]">Ajouter des photos</p>
          </div>
        </section>

        <div className="flex flex-wrap justify-between gap-2 border-t border-[#E5E7EB] pt-4">
          <button type="button" onClick={() => navigate(`${routeBase}/annonces/${id}`)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm">Annuler</button>
          <div className="flex gap-2">
            {role === 'admin' ? <button type="button" onClick={handleDeleteAnnonce} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700">Supprimer</button> : null}
            <button type="submit" disabled={saving} className="rounded-full bg-[#E02020] px-5 py-2 text-sm font-semibold text-white">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}
