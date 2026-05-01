/**
 * Tableau de bord admin — données fictives (Supabase plus tard).
 */
const FONT_PLAYFAIR = { fontFamily: '"Playfair Display", serif' }

const STATS = [
  {
    id: 'agences',
    label: 'Agences actives',
    value: '12',
    delta: '+2',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 21V9.5L12 4l8 5.5V21h-5v-6H9v6H4z"
          className="fill-[#D97B00]/25 stroke-[#D97B00]"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'annonces',
    label: 'Annonces publiées',
    value: '348',
    delta: '+24',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 3h10a2 2 0 012 2v16l-7-3-7 3V5a2 2 0 012-2z"
          className="fill-emerald-500/20 stroke-emerald-600 dark:stroke-emerald-400"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'leads',
    label: 'Leads aujourd\'hui',
    value: '94',
    delta: '+11',
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
          className="fill-sky-500/20 stroke-sky-600 dark:stroke-sky-400"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
]

const ANNONCES_RECENTES = [
  {
    id: '1',
    titre: 'Villa 6 pièces — Cocody Riviera',
    agence: 'Horizon Immobilier',
    prix: '45 000 000 FCFA',
    statut: 'Publiée',
    statutTone: 'success',
  },
  {
    id: '2',
    titre: 'Studio meublé — Marcory Zone 4',
    agence: 'Immo Plus Abidjan',
    prix: '8 500 000 FCFA',
    statut: 'En attente',
    statutTone: 'warning',
  },
  {
    id: '3',
    titre: 'Terrain 850 m² — Bingerville',
    agence: 'Terre & Mer',
    prix: '120 000 000 FCFA',
    statut: 'Publiée',
    statutTone: 'success',
  },
]

const ACTIVITE = [
  { id: 'a1', texte: 'Nouvelle annonce publiée — Villa Cocody', temps: 'Il y a 12 min', dot: 'bg-sky-500' },
  { id: 'a2', texte: 'Lead qualifié — demande de visite', temps: 'Il y a 45 min', dot: 'bg-emerald-500' },
  { id: 'a3', texte: 'Agence « Horizon » a mis à jour sa vitrine', temps: 'Il y a 2 h', dot: 'bg-amber-500' },
  { id: 'a4', texte: 'Signalement résolu — annonce Studio Marcory', temps: 'Il y a 4 h', dot: 'bg-violet-500' },
]

function badgeStatut(tone) {
  const base =
    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors'
  if (tone === 'success') {
    return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300`
  }
  return `${base} bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200`
}

export default function DashboardPage() {
  const nomAdmin = 'Aminata Koné'

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
            style={FONT_PLAYFAIR}
            className="text-2xl font-semibold tracking-tight md:text-3xl"
          >
            Bonjour, {nomAdmin}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            Voici un aperçu de l&apos;activité de la plateforme Nestymo aujourd&apos;hui.
          </p>
        </div>
        <div
          className="flex shrink-0 cursor-pointer items-center gap-3 rounded-xl bg-white/10 px-5 py-4 transition hover:bg-white/15 dark:bg-white/5 dark:hover:bg-white/10"
          role="button"
          tabIndex={0}
        >
          <span
            style={FONT_PLAYFAIR}
            className="text-3xl font-semibold text-[#D97B00] md:text-4xl"
          >
            94%
          </span>
          <span className="text-left text-sm leading-tight text-white/90">
            taux de
            <br />
            publication
          </span>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Indicateurs clés">
        {STATS.map((s) => (
          <article
            key={s.id}
            className="group cursor-pointer rounded-xl border border-[#E8E3D8] bg-white p-5 shadow-sm transition hover:border-[#D97B00]/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-[#D97B00]/50"
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-lg bg-[#FAF6EF] p-2 dark:bg-slate-800">{s.icon}</div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 transition group-hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:group-hover:bg-emerald-800/50">
                {s.delta}
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-[#0F1923] dark:text-white">
              {s.value}
            </p>
            <p className="mt-1 text-sm text-[#0F1923]/70 dark:text-slate-400">{s.label}</p>
          </article>
        ))}
      </section>

      {/* Grille bas : annonces + activité */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E8E3D8] bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2
            style={FONT_PLAYFAIR}
            className="text-lg font-semibold text-[#0F1923] dark:text-white"
          >
            Annonces récentes
          </h2>
          <ul className="mt-4 divide-y divide-[#E8E3D8] dark:divide-slate-700">
            {ANNONCES_RECENTES.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer flex-col gap-2 py-4 text-left transition first:pt-0 hover:bg-[#FAF6EF]/80 dark:hover:bg-slate-800/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#0F1923] dark:text-slate-100">{a.titre}</p>
                    <p className="mt-0.5 text-sm text-[#0F1923]/60 dark:text-slate-400">
                      {a.agence}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-sm font-semibold tabular-nums text-[#0F1923] dark:text-slate-200">
                      {a.prix}
                    </span>
                    <span className={badgeStatut(a.statutTone)}>{a.statut}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[#E8E3D8] bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2
            style={FONT_PLAYFAIR}
            className="text-lg font-semibold text-[#0F1923] dark:text-white"
          >
            Fil d&apos;activité
          </h2>
          <ul className="mt-4 space-y-0">
            {ACTIVITE.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer gap-3 rounded-lg py-3 text-left transition hover:bg-[#FAF6EF]/80 dark:hover:bg-slate-800/80"
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#0F1923] dark:text-slate-200">{item.texte}</p>
                    <p className="mt-0.5 text-xs text-[#0F1923]/55 dark:text-slate-500">
                      {item.temps}
                    </p>
                  </div>
                </button>
                {i < ACTIVITE.length - 1 ? (
                  <div className="ml-[5px] border-l border-dashed border-[#E8E3D8] dark:border-slate-600" />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
