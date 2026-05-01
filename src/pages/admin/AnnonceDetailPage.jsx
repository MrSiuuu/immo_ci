import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Eye, MousePointerClick, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'

function toKey(date) {
  return date.toISOString().slice(0, 10)
}

function bucketsFor(days) {
  const now = new Date()
  const items = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    items.push({ key: toKey(d), label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), vues: 0, clics: 0 })
  }
  return items
}

async function recordEvent(table, annonceId, userId) {
  if (!annonceId) return
  if (!userId) {
    await supabase.from(table).insert({ annonce_id: annonceId, user_id: null })
    return
  }
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('annonce_id', annonceId)
    .eq('user_id', userId)
    .gte('created_at', since)
    .limit(1)
  if ((data ?? []).length === 0) {
    await supabase.from(table).insert({ annonce_id: annonceId, user_id: userId })
  }
}

function extractPathFromPublicUrl(url) {
  if (!url) return null
  const marker = '/storage/v1/object/public/annonces-photos/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export default function AnnonceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role, user } = useUser()
  const routeBase = role === 'agent' ? '/agence' : '/admin'
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [annonce, setAnnonce] = useState(null)
  const [photos, setPhotos] = useState([])
  const [stats, setStats] = useState({ vues: 0, clics: 0, contacts: 0, series: [], contactsSeries: [] })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)

      await recordEvent('vues', id, user?.id ?? null)

      const { data: a, error: errA } = await supabase
        .from('annonces')
        .select('*, types_biens(nom), villes(nom), quartiers(nom), agences(nom)')
        .eq('id', id)
        .single()
      if (cancelled) return
      if (errA || !a) {
        setError(errA?.message ?? 'Annonce introuvable')
        setLoading(false)
        return
      }
      setAnnonce(a)

      const { data: p } = await supabase
        .from('photos')
        .select('id, url, ordre, is_principale')
        .eq('annonce_id', id)
        .order('ordre', { ascending: true })
      if (!cancelled) {
        setPhotos(p ?? [])
      }

      const since = new Date()
      since.setDate(since.getDate() - period)
      const sinceIso = since.toISOString()
      const [vuesRes, clicsRes, contactsRes] = await Promise.all([
        supabase.from('vues').select('created_at', { count: 'exact' }).eq('annonce_id', id).gte('created_at', sinceIso),
        supabase.from('clics').select('created_at', { count: 'exact' }).eq('annonce_id', id).gte('created_at', sinceIso),
        supabase.from('contacts').select('created_at', { count: 'exact' }).eq('annonce_id', id).gte('created_at', sinceIso),
      ])

      const buckets = bucketsFor(period)
      const map = Object.fromEntries(buckets.map((b) => [b.key, b]))
      for (const v of vuesRes.data ?? []) {
        const k = String(v.created_at).slice(0, 10)
        if (map[k]) map[k].vues += 1
      }
      for (const c of clicsRes.data ?? []) {
        const k = String(c.created_at).slice(0, 10)
        if (map[k]) map[k].clics += 1
      }
      const contactsByDay = {}
      for (const c of contactsRes.data ?? []) {
        const k = String(c.created_at).slice(0, 10)
        contactsByDay[k] = (contactsByDay[k] ?? 0) + 1
      }
      const contactSeries = buckets.map((b) => ({ label: b.label, contacts: contactsByDay[b.key] ?? 0 }))

      if (!cancelled) {
        setStats({
          vues: vuesRes.count ?? 0,
          clics: clicsRes.count ?? 0,
          contacts: contactsRes.count ?? 0,
          series: buckets,
          contactsSeries: contactSeries,
        })
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, period, user?.id])

  const equipementsList = useMemo(() => {
    if (!annonce?.equipements || typeof annonce.equipements !== 'object') return []
    return Object.entries(annonce.equipements)
      .filter(([, value]) => value !== false && value !== null && value !== '')
      .map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value === true ? 'Oui' : String(value)}`)
  }, [annonce])

  async function handleDeletePhoto(photo) {
    const path = extractPathFromPublicUrl(photo.url)
    if (path) await supabase.storage.from('annonces-photos').remove([path])
    await supabase.from('photos').delete().eq('id', photo.id)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  if (loading) return <p className="text-sm text-[#6B7280]">Chargement...</p>
  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#E53935]">{error}</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">{annonce?.titre}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate(`${routeBase}/annonces/${id}/edit`)} className="inline-flex items-center gap-2 rounded-full bg-[#E02020] px-4 py-2 text-sm font-semibold text-white">
            <Pencil className="h-4 w-4" /> Modifier
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-[#E5E7EB] bg-white p-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <img src={photo.url} alt="" className="h-28 w-full rounded-lg object-cover" />
              {photo.is_principale ? <span className="absolute left-2 top-2 rounded-full bg-[#E02020] px-2 py-0.5 text-[10px] text-white">Principale</span> : null}
              <button type="button" onClick={() => handleDeletePhoto(photo)} className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">X</button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#E5E7EB] bg-white p-4">
        <p className="text-sm text-[#6B7280]">{annonce?.types_biens?.nom} - {annonce?.transaction} - {Number(annonce?.prix ?? 0).toLocaleString('fr-FR')} FCFA</p>
        <p className="mt-2 text-sm text-[#1A1A1A]">{annonce?.description ?? 'Aucune description'}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p>Surface: {annonce?.surface ?? '-'} m²</p>
          <p>Chambres: {annonce?.chambres ?? '-'}</p>
          <p>Salles de bain: {annonce?.salles_de_bain ?? '-'}</p>
          <p>Adresse: {annonce?.adresse ?? '-'}</p>
          <p>Ville: {annonce?.villes?.nom ?? '-'}</p>
          <p>Quartier: {annonce?.quartiers?.nom ?? '-'}</p>
        </div>
        <div className="mt-3">
          <p className="text-sm font-medium">Equipements</p>
          {equipementsList.length === 0 ? <p className="text-sm text-[#6B7280]">Aucun</p> : (
            <ul className="mt-1 grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
              {equipementsList.map((line) => <li key={line}>- {line}</li>)}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-[#E5E7EB] bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Statistiques du bien</h2>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button key={d} type="button" onClick={() => setPeriod(d)} className={`rounded-full px-3 py-1 text-sm ${period === d ? 'bg-[#E02020] text-white' : 'border border-[#E5E7EB] bg-white text-[#1A1A1A]'}`}>{d}j</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[#E5E7EB] p-3"><p className="text-xs text-[#6B7280]">Vues</p><p className="inline-flex items-center gap-1 text-xl font-semibold"><Eye className="h-4 w-4" />{stats.vues}</p></div>
          <div className="rounded-lg border border-[#E5E7EB] p-3"><p className="text-xs text-[#6B7280]">Clics</p><p className="inline-flex items-center gap-1 text-xl font-semibold"><MousePointerClick className="h-4 w-4" />{stats.clics}</p></div>
          <div className="rounded-lg border border-[#E5E7EB] p-3"><p className="text-xs text-[#6B7280]">Contacts</p><p className="text-xl font-semibold">{stats.contacts}</p></div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="vues" stroke="#E02020" strokeWidth={2} dot={false} />
                <Line dataKey="clics" stroke="#1A1A2E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.contactsSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="contacts" fill="#00A650" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}
