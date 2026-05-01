import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react'
import { getAgentCountsByAgenceIds, getAllAgences } from './agencesService.js'

const PAGE_SIZE = 10

function BadgeCompteAgent({ count }) {
  const ok = count > 0
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ok ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#FAEEDA] text-[#854F0B]'
      }`}
    >
      {ok ? 'Compte actif' : 'Compte non créé'}
    </span>
  )
}

/**
 * Liste admin des agences : statuts, vérification, actions rapides.
 */
export default function AgencesListPage() {
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)
    try {
      const [{ data, error, count }, c] = await Promise.all([
        getAllAgences({ page, limit: PAGE_SIZE, search }),
        getAgentCountsByAgenceIds(),
      ])
      if (error) {
        setErr(error)
      }
      setRows(data)
      setCounts(c)
      setTotal(count ?? 0)
    } catch (e) {
      setErr(e?.message ?? 'Chargement impossible.')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total])

  function badgeContext(verificationStatus, statut) {
    if (statut === 'suspendue') {
      return { label: 'Suspendue', className: 'bg-[#1F2937] text-[#F9FAFB]' }
    }
    if (verificationStatus === 'verified') {
      return { label: 'Partenaire vérifié', className: 'bg-[#D1FAE5] text-[#065F46]' }
    }
    if (verificationStatus === 'rejected') {
      return { label: 'Refusée', className: 'bg-[#FEE2E2] text-[#991B1B]' }
    }
    return { label: 'En attente de validation', className: 'bg-[#FEF3C7] text-[#92400E]' }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#0F1923]/70 dark:text-slate-400">
        Chargement des agences…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight text-[#0F1923] dark:text-white"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Gestion des agences
          </h1>
          <p className="mt-1 text-sm text-[#0F1923]/65 dark:text-slate-400">
            Création, validation et suivi des partenaires Nestymo.
          </p>
        </div>
        <Link
          to="/admin/agences/new"
          className="inline-flex items-center justify-center rounded-full bg-[#E02020] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#C01818]"
        >
          Nouvelle agence
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher une agence..."
          className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1A1A1A] outline-none focus:border-[#E02020] focus:ring-1 focus:ring-[#E02020]"
        />
      </div>

      {err && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {err}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E8E3D8] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E8E3D8] text-sm dark:divide-slate-700">
            <thead className="bg-[#FAF6EF] dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1923] dark:text-slate-200">Nom</th>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1923] dark:text-slate-200">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1923] dark:text-slate-200">Statut</th>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1923] dark:text-slate-200">Compte</th>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1923] dark:text-slate-200">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-[#0F1923] dark:text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E3D8] dark:divide-slate-700">
              {rows.map((a) => {
                const n = counts[a.id] ?? 0
                const d = a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '—'
                const statusBadge = badgeContext(a.verification_status, a.statut)
                return (
                  <tr key={a.id} className="hover:bg-[#FAF6EF]/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-[#0F1923] dark:text-slate-100">{a.nom}</td>
                    <td className="px-4 py-3 text-[#0F1923]/80 dark:text-slate-300">{a.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <BadgeCompteAgent count={n} />
                    </td>
                    <td className="px-4 py-3 text-[#0F1923]/70 dark:text-slate-400">{d}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`/admin/agences/${a.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:bg-[#F9FAFB]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[#0F1923]/60 dark:text-slate-400">Aucune agence trouvée.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#6B7280]">
        <p>
          Page {page} sur {totalPages} — {total} agences au total
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-[#E5E7EB] bg-white p-2 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-[#E02020] px-3 py-1 text-xs font-semibold text-white">{page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-[#E5E7EB] bg-white p-2 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
