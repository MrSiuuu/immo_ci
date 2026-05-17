import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { displayOrDash } from '../../lib/displayOrDash'
import { useUser } from '../../hooks/useUser'

const PAGE_SIZE = 20
const PILLS = [
  { id: 'all', label: 'Tous' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telephone', label: 'Telephone' },
  { id: 'formulaire', label: 'Formulaire' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'month', label: 'Ce mois' },
]

function sourceBadge(source) {
  if (source === 'whatsapp') return 'bg-[#DCFCE7] text-[#166534]'
  if (source === 'telephone') return 'bg-[#DBEAFE] text-[#1D4ED8]'
  return 'bg-[#FFEDD5] text-[#C2410C]'
}

function messageExcerpt(text, max = 120) {
  if (!text || typeof text !== 'string') return '-'
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}...`
}

/**
 * Leads agence - memes principes que la page admin {@link LeadsPage}, filtre `agence_id`.
 * Pas d'export CSV (reserve admin).
 */
export default function AgentLeadsPage() {
  const { agenceId } = useUser()
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

  const loadKpis = useCallback(async (aid) => {
    const now = new Date()
    const todayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const monthIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    async function countVuesForAgence(agence_id) {
      const { data: annoncesRows, error: annErr } = await supabase.from('annonces').select('id').eq('agence_id', agence_id)
      if (annErr || !annoncesRows?.length) return 0
      const ids = annoncesRows.map((r) => r.id).filter(Boolean)
      const chunkSize = 150
      let total = 0
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize)
        const { count, error } = await supabase.from('vues').select('id', { count: 'exact', head: true }).in('annonce_id', chunk)
        if (error) return 0
        total += count ?? 0
      }
      return total
    }

    const [totalLeads, todayLeads, monthLeads, allViews, srcRes] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('agence_id', aid),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('agence_id', aid).gte('created_at', todayIso),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('agence_id', aid).gte('created_at', monthIso),
      countVuesForAgence(aid),
      supabase.from('contacts').select('source').eq('agence_id', aid),
    ])

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
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!agenceId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      await loadKpis(agenceId)

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      let q = supabase
        .from('contacts')
        .select('id, nom, telephone, message, source, created_at, annonce_id, annonces(titre)', {
          count: 'exact',
        })
        .eq('agence_id', agenceId)
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

      const term = search.trim()
      if (term) {
        const esc = term.replace(/%/g, '\\%').replace(/_/g, '\\_')
        const { data: annoncesMatch } = await supabase
          .from('annonces')
          .select('id')
          .eq('agence_id', agenceId)
          .ilike('titre', `%${esc}%`)
        const annonceIds = (annoncesMatch ?? []).map((a) => a.id).filter(Boolean)
        const parts = [`nom.ilike.%${esc}%`, `telephone.ilike.%${esc}%`]
        if (annonceIds.length) {
          parts.push(`annonce_id.in.(${annonceIds.join(',')})`)
        }
        q = q.or(parts.join(','))
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
  }, [page, quick, search, agenceId, loadKpis])

  if (!agenceId) {
    return <p className="text-sm text-[#6B7280]">Aucune agence associee a ce compte.</p>
  }

  return (
    <div className="space-y-4 text-[#111827]" style={{ fontFamily: '"Inter", sans-serif' }}>
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
        <span className="font-semibold text-[#111827]">SOURCES</span>
        <span className="mx-2 text-[#9CA3AF]">-</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#22C55E]" aria-hidden />
          <span className="text-[#166534]">WhatsApp {sourceStats.whatsapp}</span>
          <span className="text-[#6B7280]">
            ({totalSources ? Math.round((sourceStats.whatsapp / totalSources) * 100) : 0}%)
          </span>
        </span>
        <span className="mx-2 text-[#D1D5DB]">|</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#3B82F6]" aria-hidden />
          <span className="text-[#1D4ED8]">Telephone {sourceStats.telephone}</span>
          <span className="text-[#6B7280]">
            ({totalSources ? Math.round((sourceStats.telephone / totalSources) * 100) : 0}%)
          </span>
        </span>
        <span className="mx-2 text-[#D1D5DB]">|</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#F97316]" aria-hidden />
          <span className="text-[#C2410C]">Formulaire {sourceStats.formulaire}</span>
          <span className="text-[#6B7280]">
            ({totalSources ? Math.round((sourceStats.formulaire / totalSources) * 100) : 0}%)
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Rechercher par nom, telephone ou titre d'annonce..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="min-w-[280px] flex-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
        />
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
              quick === p.id ? 'bg-[#E02020] text-white' : 'border border-[#E5E7EB] bg-white text-[#111827]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-[#F5F7FA]">
            <tr>
              <th className="px-3 py-2">Prospect</th>
              <th className="px-3 py-2">Annonce concernee</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Message</th>
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
                  <td className="px-3 py-2">{displayOrDash(r.annonces?.titre)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sourceBadge(source)}`}>{source}</span>
                  </td>
                  <td className="max-w-[360px] px-3 py-2 text-[#374151]">{messageExcerpt(r.message)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '-'}
                  </td>
                </tr>
              )
            })}
            {!loading && rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-[#6B7280]" colSpan={5}>
                  Aucun lead trouve.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded border border-[#E5E7EB] px-2 py-1 disabled:opacity-50"
        >
          Precedent
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="rounded border border-[#E5E7EB] px-2 py-1 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
