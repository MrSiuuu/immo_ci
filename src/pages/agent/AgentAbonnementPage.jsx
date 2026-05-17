import { useCallback, useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { labelAbonnementPlan } from '../../lib/planLabels.js'

const FONT_INTER = { fontFamily: '"Inter", sans-serif' }

const PLAN_CARDS = [
  {
    id: 'starter',
    title: 'Starter',
    priceLabel: 'Gratuit',
    blurb: 'Fonctionnalites de base pour demarrer sur Nestymo.',
    features: ['Publication avec validation', 'Fiche agence', 'Leads et statistiques agence'],
    paid: false,
  },
  {
    id: 'basique',
    title: 'Basique',
    priceLabel: 'Sur devis',
    blurb: 'Visibilite renforcee et outils pour votre equipe.',
    features: ['Visibilite prioritaire', 'Rapports detaille', 'Support etendu'],
    paid: true,
  },
  {
    id: 'pro',
    title: 'Pro',
    priceLabel: 'Sur devis',
    blurb: 'Pour les agences qui accelerent sur le marketing digital.',
    features: ['Boosts et options avancees', 'Accompagnement prioritaire', 'Automatisations'],
    paid: true,
  },
  {
    id: 'premium',
    title: 'Premium',
    priceLabel: 'Sur devis',
    blurb: 'Couverture maximale et service dedie.',
    features: ['Couverture maximale', 'Boosts inclus', 'Account manager dedie'],
    paid: true,
  },
]

function statutLabel(s) {
  if (s === 'actif') return 'Actif'
  if (s === 'expire') return 'Expire'
  if (s === 'annule') return 'Resilie'
  return s ?? '-'
}

function formatFcfa(n) {
  if (n == null || Number.isNaN(Number(n))) return '-'
  return `${Number(n).toLocaleString('fr-FR')} FCFA`
}

/**
 * Abonnement agence - compte principal, UI sans paiement reel (CDC).
 */
export default function AgentAbonnementPage() {
  const { agenceId } = useUser()
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 4000)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!agenceId) {
        setLoading(false)
        return
      }
      setLoading(true)
      const { data, error } = await supabase
        .from('abonnements')
        .select('id, plan, prix, date_debut, date_fin, statut, created_at')
        .eq('agence_id', agenceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled) {
        if (error) setRow(null)
        else setRow(data ?? null)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [agenceId])

  const currentPlanId = row?.plan ?? 'starter'
  const currentIsPaid = currentPlanId !== 'starter'

  if (!agenceId) {
    return <p className="text-sm text-[#6B7280]">Aucune agence associee.</p>
  }

  if (loading) {
    return <p className="text-sm text-[#6B7280]">Chargement...</p>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8 text-[#0F1923]" style={FONT_INTER}>
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
        <p className="mt-1 text-sm text-[#666666]">Consultez votre forfait et preparez les prochaines etapes.</p>
      </header>

      <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#111111]">Forfait actuel</h2>
        {row ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-xs font-medium text-[#6B7280]">Plan</dt>
              <dd className="mt-1 font-semibold">{labelAbonnementPlan(row.plan)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#6B7280]">Prix</dt>
              <dd className="mt-1 font-semibold">{formatFcfa(row.prix)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#6B7280]">Debut</dt>
              <dd className="mt-1">{row.date_debut ? new Date(row.date_debut).toLocaleDateString('fr-FR') : '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#6B7280]">Fin</dt>
              <dd className="mt-1">{row.date_fin ? new Date(row.date_fin).toLocaleDateString('fr-FR') : '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#6B7280]">Statut</dt>
              <dd className="mt-1 font-semibold">{statutLabel(row.statut)}</dd>
            </div>
          </dl>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-4 py-6 text-center text-sm text-[#6B7280]">
            <p className="font-medium text-[#111111]">Starter</p>
            <p className="mt-1">Gratuit - fonctionnalites de base. Aucune ligne d abonnement enregistree pour le moment.</p>
          </div>
        )}
        {row && currentIsPaid ? (
          <button
            type="button"
            className="mt-6 rounded-full border border-[#111111] px-4 py-2 text-sm font-medium text-[#111111] transition hover:bg-[#F9FAFB]"
            onClick={() => showToast('Contacter le support')}
          >
            Resilier
          </button>
        ) : null}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#111111]">Plans disponibles</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_CARDS.map((p) => {
            const isCurrent = String(currentPlanId).toLowerCase() === p.id
            return (
              <article
                key={p.id}
                className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                  isCurrent ? 'border-[#E02020] ring-2 ring-[#E02020]/20' : 'border-[#E8E3D8]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-[#111111]">{p.title}</h3>
                    <p className="mt-1 text-2xl font-bold text-[#E02020]">{p.priceLabel}</p>
                  </div>
                  {isCurrent ? (
                    <span className="shrink-0 rounded-full bg-[#E02020] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      Plan actuel
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-[#6B7280]">{p.blurb}</p>
                <ul className="mt-4 flex-1 space-y-2 text-xs text-[#374151]">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E02020]" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent ? (
                  <button
                    type="button"
                    className="mt-6 w-full rounded-full border border-[#E02020] py-2 text-xs font-semibold text-[#E02020] transition hover:bg-[#E02020]/10"
                    onClick={() => showToast('Fonctionnalite disponible prochainement')}
                  >
                    Changer de plan
                  </button>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
