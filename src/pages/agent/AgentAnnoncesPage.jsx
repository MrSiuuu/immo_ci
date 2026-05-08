import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { displayOrDash } from '../../lib/displayOrDash'

const PAGE_SIZE = 20
const QUICK_FILTERS = [
  { id: 'tous', label: 'Toutes' },
  { id: 'en_attente_validation', label: 'En attente de validation' },
  { id: 'publie', label: 'Publiées' },
  { id: 'refuse', label: 'Refusées' },
  { id: 'brouillon', label: 'Brouillons' },
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

function remainingCountdown(createdAt) {
  if (!createdAt) return null
  const end = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000
  const diff = end - Date.now()
  if (diff <= 0) return null
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${mins}min`
}

export default function AgentAnnoncesPage() {
  const navigate = useNavigate()
  const { agenceId } = useUser()
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [quick, setQuick] = useState('tous')
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      let q = supabase
        .from('annonces')
        .select(
          `
            id, titre, prix, statut, transaction, created_at,
            types_biens(nom), villes(nom), quartiers(id,nom), photos(url,ordre,is_principale)
          `,
          { count: 'exact' },
        )
        .eq('agence_id', agenceId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (quick !== 'tous') q = q.eq('statut', quick)

      const term = search.trim()
      if (term) {
        const { data: quartiersRes } = await supabase.from('quartiers').select('id').ilike('nom', `%${term}%`)
        const quartierIds = (quartiersRes ?? []).map((x) => x.id).filter(Boolean)
        const orParts = [`titre.ilike.%${term}%`]
        if (quartierIds.length) orParts.push(`quartier_id.in.(${quartierIds.join(',')})`)
        q = q.or(orParts.join(','))
      }

      const { data, error: err, count: total } = await q
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
  }, [page, quick, search, agenceId])

  async function handleAction(action, annonce) {
    if (action === 'voir') {
      navigate(`/agence/annonces/${annonce.id}`)
      return
    }
    if (action === 'modifier') {
      navigate(`/agence/annonces/${annonce.id}/edit`)
      return
    }
    if (action === 'supprimer') {
      await supabase.from('annonces').delete().eq('id', annonce.id)
    }
    setPage(1)
  }

  function getActions() {
    return [
      { value: 'voir', label: 'Voir' },
      { value: 'modifier', label: 'Modifier' },
      { value: 'supprimer', label: 'Supprimer' },
    ]
  }

  return (
    <div className="mx-auto max-w-7xl text-[#111111]">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Mes annonces</h1>
          <p className="mt-1 text-xs text-[#666666]">{loading ? '...' : `Page ${page} sur ${totalPages} - ${count} annonces`}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/agence/annonces/new')} className="rounded-full bg-[#E02020] px-3 py-1.5 text-xs text-white">Nouvelle annonce</button>
        </div>
      </header>

      <div className="mb-3 rounded-xl border border-[#E5E5E5] bg-white p-3">
        <input
          placeholder="Rechercher par titre ou quartier..."
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
        <table className="w-full min-w-[920px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F5F5F5]">
              <th className="px-3 py-2 font-semibold">Photo</th>
              <th className="px-3 py-2 font-semibold">Titre</th>
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
                  <td className="px-3 py-1.5">{displayOrDash(a.quartiers?.nom)}</td>
                  <td className="px-3 py-1.5">{formatPrixFcfa(a.prix)}</td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeTransaction(a.transaction)}`}>{displayOrDash(a.transaction)}</span>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeStatut(a.statut)}`}>{displayOrDash(a.statut)}</span>
                    {a.statut === 'en_attente_validation' ? (
                      <p className="mt-1 text-[10px] text-[#854F0B]">
                        En attente de validation - dans {remainingCountdown(a.created_at) ?? '0h 0min'}
                      </p>
                    ) : null}
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
                      {getActions().map((o) => (
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
