import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const FONT_PLAYFAIR = { fontFamily: '"Playfair Display", serif' }

const TRANSACTION_OPTIONS = [
  { value: 'tous', label: 'Toutes transactions' },
  { value: 'louer', label: 'Louer' },
  { value: 'vendre', label: 'Vendre' },
  { value: 'bail', label: 'Bail' },
]

const STATUT_OPTIONS = [
  { value: 'tous', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'publie', label: 'Publié' },
  { value: 'reserve', label: 'Réservé' },
  { value: 'vendu', label: 'Vendu' },
  { value: 'loue', label: 'Loué' },
]

function formatPrixFcfa(prix) {
  if (prix == null || Number.isNaN(Number(prix))) return '—'
  const n = Number(prix)
  return `${n.toLocaleString('fr-FR')} FCFA`
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function labelTransaction(t) {
  if (!t) return '—'
  const map = { louer: 'Louer', vendre: 'Vendre', bail: 'Bail' }
  return map[t] ?? t
}

function StatutBadge({ statut }) {
  const s = statut ?? ''
  const base =
    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize dark:ring-1 dark:ring-black/5'
  if (s === 'publie') {
    return (
      <span
        className={`${base} bg-[#E1F5EE] text-[#0F6E56] dark:bg-teal-900/40 dark:text-teal-300`}
        title={s}
      >
        Publié
      </span>
    )
  }
  if (s === 'brouillon') {
    return (
      <span
        className={`${base} bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100`}
        title={s}
      >
        Brouillon
      </span>
    )
  }
  if (s === 'reserve') {
    return (
      <span
        className={`${base} bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100`}
        title={s}
      >
        Réservé
      </span>
    )
  }
  if (s === 'vendu' || s === 'loue') {
    return (
      <span
        className={`${base} bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100`}
        title={s}
      >
        {s === 'vendu' ? 'Vendu' : 'Loué'}
      </span>
    )
  }
  return (
    <span className={`${base} bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300`} title={s}>
      {s || '—'}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E8E3D8] bg-white px-8 py-20 text-center dark:border-slate-600 dark:bg-slate-900">
      <svg
        className="mb-4 h-14 w-14 text-[#D97B00]/40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        aria-hidden
      >
        <path d="M9 12h6M9 16h6M19 4H5a2 2 0 0 0-2 2v14l4-2 4 2 4-2 4 2V6a2 2 0 0 0-2-2Z" strokeLinejoin="round" />
      </svg>
      <p className="text-base font-medium text-[#0F1923] dark:text-slate-200">Aucune annonce pour le moment</p>
      <p className="mt-1 max-w-sm text-sm text-[#0F1923]/60 dark:text-slate-400">
        Créez une annonce ou modifiez vos filtres pour voir des résultats.
      </p>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E3D8] bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-center gap-2 border-b border-[#E8E3D8] px-6 py-10 dark:border-slate-700">
        <svg
          className="h-8 w-8 animate-spin text-[#D97B00]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm font-medium text-[#0F1923]/70 dark:text-slate-300">Chargement des annonces…</span>
      </div>
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-[#E8E3D8]/60 dark:bg-slate-700/60"
          />
        ))}
      </div>
    </div>
  )
}

export default function AnnoncesPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [filtreTransaction, setFiltreTransaction] = useState('tous')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('annonces')
        .select(
          `
    id, titre, prix, statut, transaction, created_at,
    agences ( nom ),
    types_biens ( nom ),
    villes ( nom ),
    quartiers ( nom )
  `,
        )
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (err) {
        setError(err.message ?? 'Erreur lors du chargement des annonces.')
        setRows([])
        setLoading(false)
        return
      }

      if (cancelled) return
      setRows(data ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((a) => {
      const titre = (a.titre ?? '').toLowerCase()
      const q = search.trim().toLowerCase()
      if (q && !titre.includes(q)) return false

      if (filtreStatut !== 'tous' && (a.statut ?? '') !== filtreStatut) return false

      if (filtreTransaction !== 'tous') {
        const t = a.transaction ?? ''
        if (t !== filtreTransaction) return false
      }

      return true
    })
  }, [rows, search, filtreStatut, filtreTransaction])

  return (
    <div className="mx-auto max-w-7xl text-[#0F1923] dark:text-slate-100">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight text-[#0F1923] dark:text-white"
            style={FONT_PLAYFAIR}
          >
            Mes annonces
          </h1>
          <p className="mt-1 text-sm text-[#0F1923]/65 dark:text-slate-400">
            {loading ? '…' : `${rows.length} annonce${rows.length !== 1 ? 's' : ''} au total`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/annonces/new')}
          className="cursor-pointer self-start rounded-lg bg-[#D97B00] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#c26a00] sm:self-auto"
        >
          Nouvelle annonce
        </button>
      </header>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8E3D8] bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:flex-row md:flex-wrap md:items-center">
        <input
          type="search"
          placeholder="Rechercher par titre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-[#E8E3D8] bg-[#FAF6EF] px-3 py-2 text-sm text-[#0F1923] placeholder:text-[#0F1923]/45 focus:outline-none focus:ring-2 focus:ring-[#D97B00] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="cursor-pointer rounded-lg border border-[#E8E3D8] bg-white px-3 py-2 text-sm text-[#0F1923] focus:outline-none focus:ring-2 focus:ring-[#D97B00] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {STATUT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={filtreTransaction}
          onChange={(e) => setFiltreTransaction(e.target.value)}
          className="cursor-pointer rounded-lg border border-[#E8E3D8] bg-white px-3 py-2 text-sm text-[#0F1923] focus:outline-none focus:ring-2 focus:ring-[#D97B00] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {TRANSACTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {loading && <TableSkeleton />}

      {!loading && !error && filtered.length === 0 && <EmptyState />}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#E8E3D8] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8E3D8] bg-[#FAF6EF]/80 dark:border-slate-700 dark:bg-slate-800/80">
                <th className="px-4 py-3 font-semibold text-[#0F1923] dark:text-slate-200">Bien</th>
                <th className="px-4 py-3 font-semibold text-[#0F1923] dark:text-slate-200">Agence</th>
                <th className="px-4 py-3 font-semibold text-[#0F1923] dark:text-slate-200">Localisation</th>
                <th className="px-4 py-3 font-semibold text-[#0F1923] dark:text-slate-200">Prix</th>
                <th className="px-4 py-3 font-semibold text-[#0F1923] dark:text-slate-200">Transaction</th>
                <th className="px-4 py-3 font-semibold text-[#0F1923] dark:text-slate-200">Statut</th>
                <th className="px-4 py-3 font-semibold text-[#0F1923] dark:text-slate-200">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/annonces/${a.id}/edit`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/admin/annonces/${a.id}/edit`)
                    }
                  }}
                  className="cursor-pointer border-b border-[#E8E3D8] transition hover:bg-[#FAF6EF]/90 dark:border-slate-700 dark:hover:bg-slate-800/80"
                >
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-[#0F1923] dark:text-slate-100">{a.titre ?? '—'}</p>
                    <p className="mt-0.5 text-xs text-[#0F1923]/55 dark:text-slate-400">
                      {a.types_biens?.nom ?? '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[#0F1923]/90 dark:text-slate-300">
                    {a.agences?.nom ?? '—'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p>{a.villes?.nom ?? '—'}</p>
                    <p className="text-xs text-[#0F1923]/55 dark:text-slate-400">
                      {a.quartiers?.nom ?? '—'}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-[#0F1923] dark:text-slate-100">
                    {formatPrixFcfa(a.prix)}
                  </td>
                  <td className="px-4 py-3">{labelTransaction(a.transaction)}</td>
                  <td className="px-4 py-3">
                    <StatutBadge statut={a.statut} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[#0F1923]/80 dark:text-slate-400">
                    {formatDate(a.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
