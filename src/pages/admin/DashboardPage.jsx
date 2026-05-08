import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminDashboardStats } from '../../features/annonces/annoncesService'
import { displayOrDash } from '../../lib/displayOrDash'
import { useUser } from '../../hooks/useUser'
import { supabase } from '../../lib/supabase'

function badgeStatut(tone) {
  const base =
    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors'
  if (tone === 'success') {
    return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300`
  }
  return `${base} bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200`
}

export default function DashboardPage() {
  const { user } = useUser()
  const [nomAdmin, setNomAdmin] = useState(user?.user_metadata?.full_name || user?.email || 'Admin')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ annoncesPubliees: 0, agencesActives: 0, leadsAujourdHui: 0, totalAnnonces: 0, tauxPublication: 0 })
  const [annoncesRecentes, setAnnoncesRecentes] = useState([])
  const [activite, setActivite] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await getAdminDashboardStats()
      if (cancelled) return
      setStats(data.stats)
      setAnnoncesRecentes(data.annoncesRecentes)
      setActivite(data.activite)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.id) return
      const { data } = await supabase.from('users').select('nom, prenom').eq('id', user.id).maybeSingle()
      if (cancelled) return
      const fullName = [data?.prenom, data?.nom].filter(Boolean).join(' ').trim()
      setNomAdmin(fullName || user?.user_metadata?.full_name || user?.email || 'Admin')
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.email, user?.user_metadata?.full_name])

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-sans text-[#0F1923] dark:text-slate-100">
      {/* Hero */}
      <section
        className="flex flex-col gap-6 rounded-2xl bg-[#1A1A2E] p-6 text-white shadow-md md:flex-row md:items-center md:justify-between md:p-8 dark:ring-1 dark:ring-white/10"
        aria-labelledby="dashboard-hero-title"
      >
        <div className="min-w-0">
          <h1
            id="dashboard-hero-title"
            style={{ fontFamily: '"Inter", sans-serif' }}
            className="text-2xl font-semibold tracking-tight md:text-3xl"
          >
            Bonjour, {nomAdmin}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            Voici un aperçu de l&apos;activité de la plateforme Nestymo aujourd&apos;hui.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl bg-white/10 px-5 py-4 transition hover:bg-white/15">
          <span
            style={{ fontFamily: '"Inter", sans-serif' }}
            className="text-3xl font-semibold text-[#D97B00] md:text-4xl"
          >
            {stats.tauxPublication}%
          </span>
          <span className="text-left text-sm leading-tight text-white/90">
            taux de
            <br />
            publication
          </span>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs clés">
        <Link to="/admin/annonces" className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm transition hover:border-[#E02020]">
          <p className="text-sm text-[#666666]">Total annonces</p>
          <p className="mt-2 text-3xl font-semibold">{loading ? '...' : stats.totalAnnonces}</p>
        </Link>
        <Link to="/admin/agences" className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm transition hover:border-[#E02020]">
          <p className="text-sm text-[#666666]">Agences actives</p>
          <p className="mt-2 text-3xl font-semibold">{loading ? '...' : stats.agencesActives}</p>
        </Link>
        <Link to="/admin/leads" className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm transition hover:border-[#E02020]">
          <p className="text-sm text-[#666666]">Leads aujourd&apos;hui</p>
          <p className="mt-2 text-3xl font-semibold">{loading ? '...' : displayOrDash(stats.leadsAujourdHui)}</p>
        </Link>
        <Link to="/admin/statistiques" className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm transition hover:border-[#E02020]">
          <p className="text-sm text-[#666666]">Annonces publiées</p>
          <p className="mt-2 text-3xl font-semibold">{loading ? '...' : stats.annoncesPubliees}</p>
        </Link>
      </section>

      {/* Grille bas : annonces + activité */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2
            style={{ fontFamily: '"Inter", sans-serif' }}
            className="text-lg font-semibold text-[#0F1923] dark:text-white"
          >
            Annonces récentes
          </h2>
          <ul className="mt-4 divide-y divide-[#E5E5E5]">
            {annoncesRecentes.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer flex-col gap-2 py-4 text-left transition first:pt-0 hover:bg-[#FAF6EF]/80 dark:hover:bg-slate-800/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#0F1923]">{a.titre}</p>
                    <p className="mt-0.5 text-sm text-[#0F1923]/60">
                      {displayOrDash(a.agences?.nom)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-sm font-semibold tabular-nums text-[#0F1923]">
                      {Number(a.prix ?? 0).toLocaleString('fr-FR')} FCFA
                    </span>
                    <span className={badgeStatut(a.statut === 'publie' ? 'success' : 'warning')}>{a.statut}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2
            style={{ fontFamily: '"Inter", sans-serif' }}
            className="text-lg font-semibold text-[#0F1923] dark:text-white"
          >
            Fil d&apos;activité
          </h2>
          <ul className="mt-4 space-y-0">
            {activite.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer gap-3 rounded-lg py-3 text-left transition hover:bg-[#FAF6EF]/80 dark:hover:bg-slate-800/80"
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#0F1923]">{item.texte}</p>
                    <p className="mt-0.5 text-xs text-[#0F1923]/55">
                      {new Date(item.temps).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </button>
                {i < activite.length - 1 ? (
                  <div className="ml-[5px] border-l border-dashed border-[#E5E5E5]" />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
