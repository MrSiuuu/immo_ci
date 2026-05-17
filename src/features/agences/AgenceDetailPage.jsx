import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { displayOrDash } from '../../lib/displayOrDash'
import { supabase } from '../../lib/supabase'
import {
  creerCompteAgent,
  getAgenceById,
  getAgentsParAgence,
  setStatutAgence,
  setVerificationStatus,
} from './agencesService.js'
import { labelAbonnementPlan } from '../../lib/planLabels.js'

function BadgeVerification({ status }) {
  const map = {
    pending: { label: 'En attente', bg: '#FAEEDA', fg: '#854F0B' },
    verified: { label: 'Partenaire vérifié', bg: '#E1F5EE', fg: '#0F6E56' },
    rejected: { label: 'Refusée', bg: '#FDE8E8', fg: '#C0392B' },
  }
  const c = map[status] ?? map.pending
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  )
}

/**
 * Détail agence : infos, actions, agents liés, création compte agent.
 */
export default function AgenceDetailPage() {
  const { id } = useParams()
  const [row, setRow] = useState(null)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [meta, setMeta] = useState({ forfait: 'starter', annoncesActives: 0, leadsMois: 0 })

  const [showFormAgent, setShowFormAgent] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [formAgentErr, setFormAgentErr] = useState(null)
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)
    const a = await getAgenceById(id)
    if (!a) {
      setErr('Agence introuvable.')
      setLoading(false)
      return
    }
    setRow(a)
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)
    const [list, abonnementsRes, annoncesRes, leadsRes] = await Promise.all([
      getAgentsParAgence(id),
      supabase.from('abonnements').select('plan, created_at').eq('agence_id', id).order('created_at', { ascending: false }),
      supabase.from('annonces').select('id', { count: 'exact', head: true }).eq('agence_id', id).eq('statut', 'publie'),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('agence_id', id).gte('created_at', thisMonthStart.toISOString()),
    ])
    setAgents(list)
    setMeta({
      forfait: abonnementsRes.data?.[0]?.plan ?? 'starter',
      annoncesActives: annoncesRes.count ?? 0,
      leadsMois: leadsRes.count ?? 0,
    })
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function runAction(fn) {
    setBusy(true)
    const { error } = await fn()
    setBusy(false)
    if (error) setErr(error)
    else await load()
  }

  async function handleCreateAgent(e) {
    e.preventDefault()
    setFormAgentErr(null)
    if (!newEmail.trim() || !newPassword.trim()) {
      setFormAgentErr('Email et mot de passe requis.')
      return
    }
    if (newPassword.length < 8) {
      setFormAgentErr('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setBusy(true)
    const res = await creerCompteAgent({
      email: newEmail.trim(),
      password: newPassword,
      agence_id: id,
      nom: null,
      prenom: null,
    })
    setBusy(false)
    if (!res.success) {
      setFormAgentErr(res.error ?? 'Erreur')
      return
    }
    setNewEmail('')
    setNewPassword('')
    setShowFormAgent(false)
    setCreatedCredentials({ email: newEmail.trim(), password: newPassword })
    await load()
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#0F1923]/70 dark:text-slate-400">
        Chargement…
      </div>
    )
  }

  if (err && !row) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {err}
      </div>
    )
  }

  const verified = row.verification_status === 'verified'
  const siteUrl = row?.site_web
    ? (/^https?:\/\//i.test(row.site_web) ? row.site_web : `https://${row.site_web}`)
    : null

  const agentsCount = agents.length
  const canCreateAgent = agentsCount < 3

  return (
    <div className="space-y-8">
      {createdCredentials ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#111111]">Compte créé avec succès</h3>
            <p className="mt-3 text-sm text-[#111111]"><strong>Email :</strong> {createdCredentials.email}</p>
            <p className="text-sm text-[#111111]"><strong>Mot de passe temporaire :</strong> {createdCredentials.password}</p>
            <p className="mt-3 text-sm font-medium text-[#C0392B]">
              Ces identifiants ne seront plus affichés après fermeture de cette fenêtre.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `Email: ${createdCredentials.email} | Mot de passe: ${createdCredentials.password}`,
                  )
                }}
                className="rounded-lg border border-[#E02020] px-3 py-2 text-sm text-[#E02020]"
              >
                Copier les identifiants
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="rounded-lg bg-[#E02020] px-3 py-2 text-sm text-white"
              >
                J&apos;ai copié les identifiants, fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight text-[#0F1923] dark:text-white"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            {row.nom}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <BadgeVerification status={row.verification_status} />
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                row.statut === 'active' ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-[#FDE8E8] text-[#C0392B]'
              }`}
            >
              {row.statut === 'active' ? 'Active' : 'Suspendue'}
            </span>
          </div>
        </div>
        <Link
          to={`/admin/agences/${id}/edit`}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#D97B00] px-4 py-2.5 text-sm font-medium text-[#D97B00] hover:bg-[#D97B00]/10"
        >
          Modifier
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#6B7280]">Forfait</p>
          <p className="mt-1 text-lg font-semibold text-[#111111]">{labelAbonnementPlan(meta.forfait)}</p>
        </article>
        <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#6B7280]">MCLU</p>
          <p className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-[#111111]">
            <span className={`h-2.5 w-2.5 rounded-full ${row.verification_status === 'verified' ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'}`} />
            {row.verification_status === 'verified' ? 'Vérifié' : 'Non vérifié'}
          </p>
        </article>
        <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#6B7280]">Annonces actives</p>
          <p className="mt-1 text-lg font-semibold text-[#111111]">{meta.annoncesActives}</p>
        </article>
        <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <p className="text-xs text-[#6B7280]">Leads ce mois</p>
          <p className="mt-1 text-lg font-semibold text-[#111111]">{meta.leadsMois}</p>
        </article>
      </section>

      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {err}
        </p>
      )}

      {!verified ? (
        <div className="rounded-xl border border-amber-200 bg-[#FAEEDA] px-4 py-3 text-sm text-[#854F0B]">
          Cette agence n&apos;est pas encore vérifiée. Ses annonces ne sont pas visibles sur le site public.
        </div>
      ) : null}

      <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-[#0F1923] dark:text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
          Informations
        </h2>
        <dl className="mt-4 grid gap-3 text-sm text-[#0F1923]/85 dark:text-slate-300 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-[#0F1923] dark:text-slate-200">Email</dt>
            <dd>{displayOrDash(row.email)}</dd>
          </div>
          <div>
            <dt className="font-medium text-[#0F1923] dark:text-slate-200">WhatsApp</dt>
            <dd>{displayOrDash(row.whatsapp)}</dd>
          </div>
          <div>
            <dt className="font-medium text-[#0F1923] dark:text-slate-200">Téléphone</dt>
            <dd>{displayOrDash(row.telephone)}</dd>
          </div>
          <div>
            <dt className="font-medium text-[#0F1923] dark:text-slate-200">Site web</dt>
            <dd>
              {siteUrl ? (
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#E02020] hover:underline"
                >
                  {row.site_web}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                displayOrDash(null)
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-[#0F1923] dark:text-slate-200">Adresse</dt>
            <dd>
              {displayOrDash([row.adresse, row.quartier, row.ville].filter(Boolean).join(', '))}
            </dd>
          </div>
          {row.description ? (
            <div className="sm:col-span-2">
              <dt className="font-medium text-[#0F1923] dark:text-slate-200">Description</dt>
              <dd className="whitespace-pre-wrap">{row.description}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-[#0F1923] dark:text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
          Actions rapides
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {row.statut === 'suspendue' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => setStatutAgence(id, 'active'))}
              className="rounded-lg border border-[#D97B00] px-3 py-2 text-sm font-medium text-[#D97B00] disabled:opacity-50"
            >
              Réactiver l’agence
            </button>
          ) : (
            <>
              {row.verification_status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(() => setVerificationStatus(id, 'verified'))}
                    className="rounded-lg bg-[#1D9E75] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(() => setVerificationStatus(id, 'rejected'))}
                    className="rounded-lg bg-[#C0392B] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </>
              )}

              {row.verification_status === 'verified' && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(() => setVerificationStatus(id, 'rejected'))}
                    className="rounded-lg bg-[#C0392B] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Refuser
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction(() => setStatutAgence(id, 'suspendue'))}
                    className="rounded-lg border border-[#D97B00] px-3 py-2 text-sm font-medium text-[#D97B00] disabled:opacity-50"
                  >
                    Suspendre l’agence
                  </button>
                </>
              )}

              {row.verification_status === 'rejected' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runAction(() => setVerificationStatus(id, 'verified'))}
                  className="rounded-lg bg-[#1D9E75] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Valider
                </button>
              )}
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[#0F1923] dark:text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
            Comptes agents
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!canCreateAgent) return
              setShowFormAgent((v) => !v)
            }}
            disabled={!canCreateAgent}
            className="rounded-lg bg-[#D97B00] px-3 py-2 text-sm font-medium text-white hover:bg-[#c26a00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showFormAgent ? 'Fermer le formulaire' : 'Créer un compte agent'}
          </button>
        </div>
        {!canCreateAgent ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-[#FAEEDA] px-3 py-2 text-sm text-[#854F0B]">
            Limite atteinte - Cette agence dispose déjà de 3 comptes agents (maximum autorisé)
          </p>
        ) : (
          <p className="mt-3 text-sm text-[#666666]">
            Cette agence peut avoir au maximum 3 comptes agents (actuellement : {agentsCount}/3)
          </p>
        )}

        {showFormAgent && canCreateAgent ? (
          <form onSubmit={handleCreateAgent} className="mt-4 space-y-3 rounded-lg border border-[#E8E3D8] bg-[#FAF6EF] p-4 dark:border-slate-600 dark:bg-slate-800">
            <p className="text-sm text-[#0F1923]/70 dark:text-slate-400">
              Créez un nouvel accès agent pour cette agence (email unique).
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0F1923] dark:text-slate-200">Email</label>
              <input
                className="w-full rounded-lg border border-[#E8E3D8] bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#0F1923] dark:text-slate-200">Mot de passe (min. 8)</label>
              <input
                className="w-full rounded-lg border border-[#E8E3D8] bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {formAgentErr && <p className="text-sm text-red-600 dark:text-red-400">{formAgentErr}</p>}
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#1A1A2E] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? 'Création…' : 'Créer le compte'}
            </button>
          </form>
        ) : null}

        <ul className="mt-4 divide-y divide-[#E8E3D8] dark:divide-slate-700">
          {agents.map((u) => (
            <li key={u.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-[#0F1923] dark:text-slate-100">{u.email}</p>
                <p className="text-sm text-[#0F1923]/65 dark:text-slate-400">
                  {displayOrDash([u.prenom, u.nom].filter(Boolean).join(' '))}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {u.is_owner ? (
                    <span className="rounded-full bg-[#374151] px-2 py-0.5 text-xs font-semibold text-white">
                      Compte principal
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-xs font-semibold text-[#374151]">
                      Compte secondaire
                    </span>
                  )}
                  {u.statut === 'suspendu' ? (
                    <span className="rounded-full bg-[#FDE8E8] px-2 py-0.5 text-xs font-semibold text-[#C0392B]">
                      Suspendu
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-xs font-semibold text-[#0F6E56]">
                      Actif
                    </span>
                  )}
                  {u.must_change_password ? (
                    <span className="rounded-full bg-[#FAEEDA] px-2 py-0.5 text-xs font-semibold text-[#854F0B]">
                      Mot de passe à changer
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-xs text-[#666666]">
                Créé le {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : displayOrDash(null)}
              </div>
            </li>
          ))}
        </ul>
        {agents.length === 0 && !showFormAgent && (
          <p className="mt-4 text-sm text-[#0F1923]/60 dark:text-slate-400">Aucun agent lié pour le moment.</p>
        )}
      </section>
    </div>
  )
}
