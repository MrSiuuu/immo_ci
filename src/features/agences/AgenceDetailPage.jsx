import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  creerCompteAgent,
  getAgenceById,
  getAgentsParAgence,
  setStatutAgent,
  setStatutAgence,
  setVerificationStatus,
} from './agencesService.js'

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

  const [showFormAgent, setShowFormAgent] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [formAgentErr, setFormAgentErr] = useState(null)

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
    const list = await getAgentsParAgence(id)
    setAgents(list)
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

  return (
    <div className="space-y-8">
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
            <dd>{row.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-[#0F1923] dark:text-slate-200">WhatsApp</dt>
            <dd>{row.whatsapp ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-[#0F1923] dark:text-slate-200">Téléphone</dt>
            <dd>{row.telephone ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-[#0F1923] dark:text-slate-200">Site web</dt>
            <dd>{row.site_web ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-[#0F1923] dark:text-slate-200">Adresse</dt>
            <dd>
              {[row.adresse, row.quartier, row.ville].filter(Boolean).join(', ') || '—'}
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
            onClick={() => setShowFormAgent((v) => !v)}
            className="rounded-lg bg-[#D97B00] px-3 py-2 text-sm font-medium text-white hover:bg-[#c26a00]"
          >
            {showFormAgent ? 'Fermer le formulaire' : 'Créer un compte agent'}
          </button>
        </div>

        {showFormAgent ? (
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
                  {[u.prenom, u.nom].filter(Boolean).join(' ') || '—'}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
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
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction(() => setStatutAgent(u.id, u.statut === 'actif' ? 'suspendu' : 'actif'))
                  }
                  className="rounded-md border border-[#D97B00] px-2 py-1 text-xs font-medium text-[#D97B00] disabled:opacity-50"
                >
                  {u.statut === 'actif' ? 'Suspendre' : 'Réactiver'}
                </button>
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
