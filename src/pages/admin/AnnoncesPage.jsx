import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ImageOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { displayOrDash } from '../../lib/displayOrDash'

const PAGE_SIZE = 20
const QUICK_FILTERS = [
  { id: 'all_agencies', label: 'Toutes les agences' },
  { id: 'tous', label: 'Tous' },
  { id: 'en_attente_validation', label: 'En attente' },
  { id: 'publie', label: 'Publiées' },
  { id: 'refuse', label: 'Refusées' },
]

function formatPrixFcfa(prix) {
  if (prix == null || Number.isNaN(Number(prix))) return '-'
  return `${Number(prix).toLocaleString('fr-FR')} FCFA`
}

function badgeStatut(statut) {
  if (statut === 'en_attente_validation') return 'bg-[#FAEEDA] text-[#854F0B]'
  if (statut === 'publie') return 'bg-[#E1F5EE] text-[#0F6E56]'
  if (statut === 'refuse') return 'bg-[#FDE8E8] text-[#C0392B]'
  if (statut === 'brouillon') return 'bg-[#F3F4F6] text-[#6B7280]'
  return 'bg-[#F5F5F5] text-[#666666]'
}

function badgeTransaction(tx) {
  if (tx === 'louer') return 'bg-[#DBEAFE] text-[#1D4ED8]'
  if (tx === 'vendre') return 'bg-[#DCFCE7] text-[#15803D]'
  return 'bg-[#F3F4F6] text-[#6B7280]'
}

export default function AnnoncesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const routeBase = '/admin'

  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [quick, setQuick] = useState(() => {
    const val = searchParams.get('quick')
    return QUICK_FILTERS.some((x) => x.id === val) ? val : 'all_agencies'
  })
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count])

  const applyQuery = useCallback(async ({
    withRange = true,
    pageArg = page,
    quickArg = quick,
    searchArg = search,
  } = {}) => {
    const from = (pageArg - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    let q = supabase
      .from('annonces')
      .select(
        `
          id, titre, prix, statut, transaction, created_at, created_by, agence_id, ville_id, quartier_id,
          agences(id, nom), types_biens(nom), villes(nom), quartiers(id,nom), photos(url,ordre,is_principale),
          users:created_by(nom, prenom, email)
        `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })

    if (withRange) q = q.range(from, to)

    if (quickArg !== 'tous' && quickArg !== 'all_agencies') q = q.eq('statut', quickArg)

    const term = searchArg.trim()
    if (term) {
      const [agencesRes, quartiersRes] = await Promise.all([
        supabase.from('agences').select('id').ilike('nom', `%${term}%`),
        supabase.from('quartiers').select('id').ilike('nom', `%${term}%`),
      ])
      const agenceIds = (agencesRes.data ?? []).map((x) => x.id).filter(Boolean)
      const quartierIds = (quartiersRes.data ?? []).map((x) => x.id).filter(Boolean)
      const orParts = [`titre.ilike.%${term}%`]
      if (agenceIds.length) orParts.push(`agence_id.in.(${agenceIds.join(',')})`)
      if (quartierIds.length) orParts.push(`quartier_id.in.(${quartierIds.join(',')})`)
      q = q.or(orParts.join(','))
    }

    return q
  }, [page, quick, search])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const { data, error: err, count: total } = await applyQuery()
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
  }, [page, quick, search, applyQuery])

  useEffect(() => {
    const val = searchParams.get('quick')
    const normalized = QUICK_FILTERS.some((x) => x.id === val) ? val : 'all_agencies'
    if (normalized !== quick) {
      setQuick(normalized)
      setPage(1)
    }
  }, [searchParams, quick])

  async function exportCsv() {
    const { data, error: err } = await applyQuery({ withRange: false })
    if (err) {
      setError(err.message)
      return
    }
    const headers = ['Titre', 'Agence', 'Quartier', 'Ville', 'Prix', 'Transaction', 'Statut', 'Date']
    const lines = (data ?? []).map((a) =>
      [
        `"${String(a.titre ?? '').replaceAll('"', '""')}"`,
        `"${String(a.agences?.nom ?? '').replaceAll('"', '""')}"`,
        `"${String(a.quartiers?.nom ?? '').replaceAll('"', '""')}"`,
        `"${String(a.villes?.nom ?? '').replaceAll('"', '""')}"`,
        Number(a.prix ?? 0),
        a.transaction ?? '',
        a.statut ?? '',
        a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '',
      ].join(','),
    )
    const csv = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `annonces_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleAction(action, annonce) {
    if (action === 'voir') {
      navigate(`${routeBase}/annonces/${annonce.id}`)
      return
    }
    if (action === 'publier') {
      await supabase.from('annonces').update({ statut: 'publie' }).eq('id', annonce.id)
    } else if (action === 'refuser') {
      await supabase.from('annonces').update({ statut: 'refuse' }).eq('id', annonce.id)
    }
    const { data, error: err, count: total } = await applyQuery()
    if (err) setError(err.message)
    else {
      setRows(data ?? [])
      setCount(total ?? 0)
    }
  }

  function getActions(annonce) {
    const opts = [{ value: 'voir', label: 'Voir' }]
    if (annonce.statut !== 'publie') opts.push({ value: 'publier', label: 'Publier' })
    if (annonce.statut !== 'refuse') opts.push({ value: 'refuser', label: 'Refuser' })
    return opts
  }

  return (
    <div className="mx-auto max-w-7xl text-[#111111]">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Annonces admin</h1>
          <p className="mt-1 text-xs text-[#666666]">{loading ? '...' : `Page ${page} sur ${totalPages} - ${count} annonces`}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportCsv} className="rounded-full border border-[#E02020] px-3 py-1.5 text-xs text-[#E02020]">Export CSV</button>
          <button type="button" onClick={() => navigate(`${routeBase}/annonces/new`)} className="rounded-full bg-[#E02020] px-3 py-1.5 text-xs text-white">Nouvelle annonce</button>
        </div>
      </header>

      <div className="mb-3 rounded-xl border border-[#E5E5E5] bg-white p-3">
        <input
          placeholder="Rechercher par titre, agence ou quartier..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setQuick(f.id)
              setPage(1)
              const next = new URLSearchParams(searchParams)
              next.set('quick', f.id)
              setSearchParams(next, { replace: true })
            }}
            className={`rounded-full px-3 py-1.5 text-xs ${
              quick === f.id ? 'bg-[#E02020] text-white' : 'border border-[#E5E5E5] bg-white text-[#111111]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] bg-white">
        <table className="w-full min-w-[980px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F5F5F5]">
              <th className="px-3 py-2 font-semibold">Photo</th>
              <th className="px-3 py-2 font-semibold">Titre</th>
              <th className="px-3 py-2 font-semibold">Agence</th>
              <th className="px-3 py-2 font-semibold">Quartier</th>
              <th className="px-3 py-2 font-semibold">Prix</th>
              <th className="px-3 py-2 font-semibold">Transaction</th>
              <th className="px-3 py-2 font-semibold">Statut</th>
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-3 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const firstPhoto = (a.photos ?? []).slice().sort((x, y) => (x.ordre ?? 0) - (y.ordre ?? 0))[0]
              return (
                <tr
                  key={a.id}
                  className={`border-b border-[#E5E5E5] hover:bg-[#F8F8F8] ${
                    a.statut === 'en_attente_validation' ? 'bg-[#FFF6F6] shadow-[inset_3px_0_0_0_#E02020]' : ''
                  }`}
                >
                  <td className="px-3 py-1.5">
                    {firstPhoto?.url ? (
                      <img src={firstPhoto.url} alt="" className="h-9 w-9 rounded object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-[#F2F2F2] text-[#999999]">
                        <ImageOff className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-1.5">{displayOrDash(a.titre)}</td>
                  <td className="px-3 py-1.5">{displayOrDash(a.agences?.nom)}</td>
                  <td className="px-3 py-1.5">{displayOrDash(a.quartiers?.nom)}</td>
                  <td className="px-3 py-1.5">{formatPrixFcfa(a.prix)}</td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeTransaction(a.transaction)}`}>{displayOrDash(a.transaction)}</span>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeStatut(a.statut)}`}>{displayOrDash(a.statut)}</span>
                  </td>
                  <td className="px-3 py-1.5">{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                  <td className="px-3 py-1.5">
                    <select
                      defaultValue=""
                      className="rounded-md border border-[#E5E5E5] px-2 py-1 text-xs"
                      onChange={(e) => {
                        const val = e.target.value
                        if (!val) return
                        handleAction(val, a)
                        e.target.value = ''
                      }}
                    >
                      <option value="" disabled>
                        Actions
                      </option>
                      {getActions(a).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <p>Page {page} sur {totalPages} - {count} annonces</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-full border border-[#E5E5E5] px-3 py-1 disabled:opacity-50">Précédent</button>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-full border border-[#E5E5E5] px-3 py-1 disabled:opacity-50">Suivant</button>
        </div>
      </div>
    </div>
  )
}
