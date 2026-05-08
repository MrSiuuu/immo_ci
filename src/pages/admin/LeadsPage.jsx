import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { displayOrDash } from '../../lib/displayOrDash'

const PAGE_SIZE = 20
const PILLS = [
  { id: 'all', label: 'Tous' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telephone', label: 'Téléphone' },
  { id: 'formulaire', label: 'Formulaire' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'month', label: 'Ce mois' },
]

function sourceBadge(source) {
  if (source === 'whatsapp') return 'bg-[#DCFCE7] text-[#166534]'
  if (source === 'telephone') return 'bg-[#DBEAFE] text-[#1D4ED8]'
  return 'bg-[#FFEDD5] text-[#C2410C]'
}

export default function LeadsPage() {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [quick, setQuick] = useState('all')
  const [kpis, setKpis] = useState({ total: 0, today: 0, month: 0, conversion: '0.0' })
  const [sourceStats, setSourceStats] = useState({ whatsapp: 0, telephone: 0, formulaire: 0 })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count])
  const totalSources = sourceStats.whatsapp + sourceStats.telephone + sourceStats.formulaire

  async function loadKpis() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const month = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const [totalLeads, todayLeads, monthLeads, viewsRes, srcRes] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('created_at', month),
      supabase.from('vues').select('id', { count: 'exact', head: true }),
      supabase.from('contacts').select('source'),
    ])
    const allViews = viewsRes.count ?? 0
    const allLeads = totalLeads.count ?? 0
    const conversion = allViews > 0 ? ((allLeads / allViews) * 100).toFixed(1) : '0.0'
    const s = { whatsapp: 0, telephone: 0, formulaire: 0 }
    for (const r of srcRes.data ?? []) {
      const key = r.source || 'formulaire'
      if (key in s) s[key] += 1
    }
    setKpis({
      total: allLeads,
      today: todayLeads.count ?? 0,
      month: monthLeads.count ?? 0,
      conversion,
    })
    setSourceStats(s)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      await loadKpis()

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      let q = supabase
        .from('contacts')
        .select('id, nom, telephone, message, source, created_at, annonce_id, agence_id, annonces(titre), agences(nom)', {
          count: 'exact',
        })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (quick === 'whatsapp' || quick === 'telephone' || quick === 'formulaire') q = q.eq('source', quick)
      if (quick === 'today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        q = q.gte('created_at', today.toISOString())
      }
      if (quick === 'month') {
        const month = new Date()
        month.setDate(1)
        month.setHours(0, 0, 0, 0)
        q = q.gte('created_at', month.toISOString())
      }
      if (search.trim()) {
        q = q.or(`nom.ilike.%${search.trim()}%,telephone.ilike.%${search.trim()}%`)
      }

      const { data, count: total, error: err } = await q
      if (cancelled) return
      if (err) {
        setError(err.message)
        setRows([])
      } else {
        setRows(data ?? [])
        setCount(total ?? 0)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [page, quick, search])

  async function exportCsv() {
    let q = supabase
      .from('contacts')
      .select('nom, telephone, message, source, created_at, annonces(titre), agences(nom)')
      .order('created_at', { ascending: false })
    if (quick === 'whatsapp' || quick === 'telephone' || quick === 'formulaire') q = q.eq('source', quick)
    const { data } = await q
    const headers = ['Prospect', 'Telephone', 'Annonce', 'Agence', 'Source', 'Date', 'Message']
    const lines = (data ?? []).map((r) =>
      [
        `"${String(r.nom ?? '').replaceAll('"', '""')}"`,
        `"${String(r.telephone ?? '').replaceAll('"', '""')}"`,
        `"${String(r.annonces?.titre ?? '').replaceAll('"', '""')}"`,
        `"${String(r.agences?.nom ?? '').replaceAll('"', '""')}"`,
        r.source ?? 'formulaire',
        r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '',
        `"${String(r.message ?? '').replaceAll('"', '""')}"`,
      ].join(','),
    )
    const csv = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 text-[#111827]">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Total leads', kpis.total],
          ["Aujourd'hui", kpis.today],
          ['Ce mois', kpis.month],
          ['Taux conversion', `${kpis.conversion}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <p className="text-xs text-[#6B7280]">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm">
        <strong>SOURCES :</strong> <span className="text-green-600">WhatsApp {sourceStats.whatsapp}</span> ({totalSources ? Math.round((sourceStats.whatsapp / totalSources) * 100) : 0}%)
        {' - '}
        <span className="text-blue-600">Téléphone {sourceStats.telephone}</span> ({totalSources ? Math.round((sourceStats.telephone / totalSources) * 100) : 0}%)
        {' - '}
        <span className="text-orange-600">Formulaire {sourceStats.formulaire}</span> ({totalSources ? Math.round((sourceStats.formulaire / totalSources) * 100) : 0}%)
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          placeholder="Rechercher par nom, téléphone ou titre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="min-w-[280px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
        />
        <button type="button" onClick={exportCsv} className="rounded-full border border-[#E02020] px-3 py-1.5 text-xs text-[#E02020]">Export CSV</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PILLS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setQuick(p.id)
              setPage(1)
            }}
            className={`rounded-full px-3 py-1.5 text-xs ${
              quick === p.id ? 'bg-[#E02020] text-white' : 'border border-[#E5E7EB] bg-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
        <table className="w-full min-w-[1100px] text-left text-xs">
          <thead className="bg-[#F5F7FA]">
            <tr>
              <th className="px-3 py-2">Prospect</th>
              <th className="px-3 py-2">Annonce concernée</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Message</th>
              <th className="px-3 py-2">Agence</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const source = r.source || 'formulaire'
              return (
                <tr key={r.id} className="border-t border-[#E5E7EB]">
                  <td className="px-3 py-2">
                    <p className="font-medium">{displayOrDash(r.nom)}</p>
                    <p className="text-[#6B7280]">{displayOrDash(r.telephone)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p>{displayOrDash(r.annonces?.titre)}</p>
                    <p className="text-[#6B7280]">{displayOrDash(r.agences?.nom)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sourceBadge(source)}`}>{source}</span>
                  </td>
                  <td className="max-w-[350px] truncate px-3 py-2">{displayOrDash(r.message)}</td>
                  <td className="px-3 py-2">{displayOrDash(r.agences?.nom)}</td>
                  <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                </tr>
              )
            })}
            {!loading && rows.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-[#6B7280]" colSpan={6}>Aucun lead trouvé.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 text-xs">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border border-[#E5E7EB] px-2 py-1 disabled:opacity-50">Précédent</button>
        <span>{page} / {totalPages}</span>
        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded border border-[#E5E7EB] px-2 py-1 disabled:opacity-50">Suivant</button>
      </div>
    </div>
  )
}
