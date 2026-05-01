import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, FileEdit, LayoutDashboard, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import AgentTutorial from '../../components/AgentTutorial.jsx'

const FONT_INTER = { fontFamily: '"Inter", sans-serif' }

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

function formatPrixFcfa(prix) {
  if (prix == null || Number.isNaN(Number(prix))) return '—'
  return `${Number(prix).toLocaleString('fr-FR')} FCFA`
}

function StatutBadge({ statut }) {
  const s = statut ?? ''
  const base =
    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize dark:ring-1 dark:ring-black/5'
  if (s === 'publie') {
    return <span className={`${base} bg-[#E1F5EE] text-[#0F6E56]`}>Publié</span>
  }
  if (s === 'brouillon') {
    return <span className={`${base} bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100`}>Brouillon</span>
  }
  return <span className={`${base} bg-gray-100 text-gray-600`}>{s || '—'}</span>
}

/**
 * Tableau de bord agent — stats réelles + dernières annonces + tutoriel première visite.
 */
export default function AgentDashboardPage() {
  const { user, agence, agenceId, hasSeenTutorial, refreshProfile } = useUser()
  const [counts, setCounts] = useState({ publie: 0, brouillon: 0, contacts: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  )

  const load = useCallback(async () => {
    if (!agenceId) {
      setLoading(false)
      return
    }
    setErr(null)
    setLoading(true)
    try {
      const [pubRes, broRes, contRes, annRes] = await Promise.all([
        supabase
          .from('annonces')
          .select('id', { count: 'exact', head: true })
          .eq('agence_id', agenceId)
          .eq('statut', 'publie'),
        supabase
          .from('annonces')
          .select('id', { count: 'exact', head: true })
          .eq('agence_id', agenceId)
          .eq('statut', 'brouillon'),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('agence_id', agenceId),
        supabase
          .from('annonces')
          .select('id, titre, prix, statut, created_at')
          .eq('agence_id', agenceId)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setCounts({
        publie: pubRes.error ? 0 : pubRes.count ?? 0,
        brouillon: broRes.error ? 0 : broRes.count ?? 0,
        contacts: contRes.error ? 0 : contRes.count ?? 0,
      })
      if (annRes.error) {
        setErr(annRes.error.message)
        setRecent([])
      } else {
        setRecent(annRes.data ?? [])
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur de chargement.')
      setRecent([])
    } finally {
      setLoading(false)
    }
  }, [agenceId])

  useEffect(() => {
    load()
  }, [load])

  const agenceNom = agence?.nom?.trim() || 'votre agence'
  const tutorialEnabled = Boolean(user?.id) && !hasSeenTutorial

  return (
    <div className="mx-auto max-w-6xl space-y-8 text-[#0F1923] dark:text-slate-100">
      {tutorialEnabled ? (
        <AgentTutorial enabled={tutorialEnabled} userId={user.id} refreshProfile={refreshProfile} />
      ) : null}

      <header>
        <h1
          className="text-3xl font-bold tracking-tight text-[#0F1923] dark:text-white"
          style={FONT_INTER}
        >
          Bonjour, {agenceNom}
        </h1>
        <p className="mt-2 capitalize text-sm text-[#0F1923]/65 dark:text-slate-400">{dateLabel}</p>
      </header>

      <section
        data-tour="agent-dashboard-stats"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Statistiques"
      >
        <div className="rounded-2xl border border-[#E8E3D8] bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E1F5EE] text-[#0F6E56]">
              <LayoutDashboard className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#0F1923]/50 dark:text-slate-400">
                Annonces publiées
              </p>
              <p className="text-2xl font-semibold tabular-nums">{loading ? '—' : counts.publie}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#E8E3D8] bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <FileEdit className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#0F1923]/50 dark:text-slate-400">
                Brouillons
              </p>
              <p className="text-2xl font-semibold tabular-nums">{loading ? '—' : counts.brouillon}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#E8E3D8] bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
              <MessageCircle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#0F1923]/50 dark:text-slate-400">
                Contacts reçus
              </p>
              <p className="text-2xl font-semibold tabular-nums">{loading ? '—' : counts.contacts}</p>
            </div>
          </div>
        </div>
      </section>

      {err ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </p>
      ) : null}

      <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#E02020]" aria-hidden />
          <h2 className="text-lg font-semibold text-[#0F1923] dark:text-white" style={FONT_INTER}>
            Dernières annonces
          </h2>
        </div>
        {!loading && recent.length === 0 ? (
          <p className="text-sm text-[#0F1923]/60 dark:text-slate-400">Aucune annonce pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8E3D8] text-[#0F1923]/60 dark:border-slate-700 dark:text-slate-400">
                  <th className="pb-2 pr-4 font-semibold">Titre</th>
                  <th className="pb-2 pr-4 font-semibold">Prix</th>
                  <th className="pb-2 pr-4 font-semibold">Statut</th>
                  <th className="pb-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id} className="border-b border-[#E8E3D8]/80 last:border-0 dark:border-slate-700/80">
                    <td className="py-3 pr-4 font-medium text-[#0F1923] dark:text-slate-100">{a.titre ?? '—'}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatPrixFcfa(a.prix)}</td>
                    <td className="py-3 pr-4">
                      <StatutBadge statut={a.statut} />
                    </td>
                    <td className="py-3 text-[#0F1923]/70 dark:text-slate-400">{formatDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
