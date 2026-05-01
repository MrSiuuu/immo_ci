import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'

function toDateKey(d) {
  return d.toISOString().slice(0, 10)
}

function buildDayBuckets(days) {
  const out = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const dt = new Date(now)
    dt.setDate(now.getDate() - i)
    out.push({ key: toDateKey(dt), label: dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) })
  }
  return out
}

export default function AgentStatistiquesPage() {
  const { agenceId } = useUser()
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [kpis, setKpis] = useState({ annonces: 0, vues: 0, clics: 0, contacts: 0 })
  const [viewsDaily, setViewsDaily] = useState([])
  const [contactsMonthly, setContactsMonthly] = useState([])
  const [typeDistribution, setTypeDistribution] = useState([])
  const [topListings, setTopListings] = useState([])

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      if (!agenceId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)

      const since = new Date()
      since.setDate(since.getDate() - period)
      const sinceIso = since.toISOString()

      const { data: annonces, error: annoncesErr } = await supabase
        .from('annonces')
        .select('id, titre, statut, type_bien_id, types_biens(nom)')
        .eq('agence_id', agenceId)

      if (cancelled) return
      if (annoncesErr) {
        setError(annoncesErr.message)
        setLoading(false)
        return
      }

      const annonceIds = (annonces ?? []).map((a) => a.id)
      const publishedCount = (annonces ?? []).filter((a) => a.statut === 'publie').length

      let views = []
      let clicks = []
      let contacts = []
      if (annonceIds.length > 0) {
        const [vuesRes, clicsRes, contactsRes] = await Promise.all([
          supabase.from('vues').select('annonce_id, created_at').in('annonce_id', annonceIds).gte('created_at', sinceIso),
          supabase.from('clics').select('annonce_id, created_at').in('annonce_id', annonceIds).gte('created_at', sinceIso),
          supabase.from('contacts').select('annonce_id, created_at').eq('agence_id', agenceId).gte('created_at', sinceIso),
        ])
        views = vuesRes.data ?? []
        clicks = clicsRes.data ?? []
        contacts = contactsRes.data ?? []
      }

      const buckets = buildDayBuckets(period).map((b) => ({ ...b, vues: 0, clics: 0 }))
      const bucketMap = Object.fromEntries(buckets.map((b) => [b.key, b]))
      for (const v of views) {
        const k = String(v.created_at).slice(0, 10)
        if (bucketMap[k]) bucketMap[k].vues += 1
      }
      for (const c of clicks) {
        const k = String(c.created_at).slice(0, 10)
        if (bucketMap[k]) bucketMap[k].clics += 1
      }

      const contactsByMonth = {}
      for (const c of contacts) {
        const m = String(c.created_at).slice(0, 7)
        contactsByMonth[m] = (contactsByMonth[m] ?? 0) + 1
      }
      const contactsMonthlySeries = Object.entries(contactsByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({ month, contacts: total }))

      const typeMap = {}
      for (const a of annonces ?? []) {
        const name = a.types_biens?.nom ?? 'Non defini'
        typeMap[name] = (typeMap[name] ?? 0) + 1
      }
      const typeSeries = Object.entries(typeMap).map(([name, value]) => ({ name, value }))

      const vuesByAnnonce = {}
      const clicsByAnnonce = {}
      const contactsByAnnonce = {}
      for (const v of views) vuesByAnnonce[v.annonce_id] = (vuesByAnnonce[v.annonce_id] ?? 0) + 1
      for (const c of clicks) clicsByAnnonce[c.annonce_id] = (clicsByAnnonce[c.annonce_id] ?? 0) + 1
      for (const c of contacts) contactsByAnnonce[c.annonce_id] = (contactsByAnnonce[c.annonce_id] ?? 0) + 1

      const top = (annonces ?? [])
        .map((a) => ({
          id: a.id,
          titre: a.titre,
          statut: a.statut,
          vues: vuesByAnnonce[a.id] ?? 0,
          clics: clicsByAnnonce[a.id] ?? 0,
          contacts: contactsByAnnonce[a.id] ?? 0,
        }))
        .sort((a, b) => b.vues - a.vues)
        .slice(0, 10)

      if (cancelled) return
      setKpis({
        annonces: publishedCount,
        vues: views.length,
        clics: clicks.length,
        contacts: contacts.length,
      })
      setViewsDaily(buckets)
      setContactsMonthly(contactsMonthlySeries)
      setTypeDistribution(typeSeries)
      setTopListings(top)
      setLoading(false)
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [agenceId, period])

  const periodButtons = useMemo(() => [7, 30, 90], [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Statistiques</h1>
        <div className="flex gap-2">
          {periodButtons.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setPeriod(d)}
              className={`rounded-full px-3 py-1 text-sm ${period === d ? 'bg-[#E02020] text-white' : 'bg-white text-[#1A1A1A] border border-[#E5E7EB]'}`}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#E53935]">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4"><p className="text-xs text-[#6B7280]">Annonces publiees</p><p className="text-xl font-semibold">{loading ? '-' : kpis.annonces}</p></div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4"><p className="text-xs text-[#6B7280]">Total vues</p><p className="text-xl font-semibold">{loading ? '-' : kpis.vues}</p></div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4"><p className="text-xs text-[#6B7280]">Total clics</p><p className="text-xl font-semibold">{loading ? '-' : kpis.clics}</p></div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4"><p className="text-xs text-[#6B7280]">Total contacts</p><p className="text-xl font-semibold">{loading ? '-' : kpis.contacts}</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Vues par jour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={viewsDaily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="vues" stroke="#E02020" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clics" stroke="#1A1A2E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Contacts par mois</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={contactsMonthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="contacts" fill="#00A650" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold">Repartition par type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={typeDistribution} dataKey="value" nameKey="name" outerRadius={90} fill="#E02020" />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Biens les plus performants</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6B7280]">
                  <th className="py-2">Titre</th><th>Vues</th><th>Clics</th><th>Contacts</th><th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {topListings.map((row) => (
                  <tr key={row.id} className="border-t border-[#F0F0F0]">
                    <td className="py-2">{row.titre}</td><td>{row.vues}</td><td>{row.clics}</td><td>{row.contacts}</td><td>{row.statut}</td>
                  </tr>
                ))}
                {!loading && topListings.length === 0 ? (
                  <tr><td className="py-3 text-[#6B7280]" colSpan={5}>Aucune donnee.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
