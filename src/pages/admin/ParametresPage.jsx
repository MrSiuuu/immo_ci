import { useCallback, useEffect, useState } from 'react'
import ConfirmModal from '../../components/ConfirmModal.jsx'
import { useUser } from '../../hooks/useUser'
import { supabase } from '../../lib/supabase'

const FONT_PLAYFAIR = { fontFamily: '"Playfair Display", serif' }

function IconXSmall(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Modale plein écran : overlay + panneau, fermeture overlay / bouton.
 */
function GestionModal({ title, open, onClose, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="gestion-modal-title">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-black/50 dark:bg-black/60"
        onClick={onClose}
        aria-label="Fermer la fenêtre"
      />
      <div
        className="relative z-10 w-full max-w-lg cursor-default rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E8E3D8] pb-4 dark:border-slate-700">
          <h2
            id="gestion-modal-title"
            className="pr-8 text-xl font-semibold text-[#0F1923] dark:text-white"
            style={FONT_PLAYFAIR}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-[#0F1923]/55 transition hover:bg-[#FAF6EF] hover:text-[#0F1923] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Fermer"
          >
            <IconXSmall className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 max-h-[min(70vh,520px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function VillesModalBody({ onDataChange, openConfirm }) {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [nom, setNom] = useState('')

  const load = useCallback(async () => {
    setErr(null)
    const { data, error } = await supabase.from('villes').select('*').order('nom')
    if (error) {
      setErr(error.message)
      setRows([])
      return
    }
    setRows(data ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd(e) {
    e.preventDefault()
    const n = nom.trim()
    if (!n) return
    setErr(null)
    const { error } = await supabase.from('villes').insert({ nom: n })
    if (error) {
      setErr(error.message)
      return
    }
    setNom('')
    await load()
    onDataChange?.()
  }

  function handleDelete(id) {
    openConfirm({
      title: 'Supprimer cette ville ?',
      message: '',
      onConfirm: async () => {
        setErr(null)
        const { error } = await supabase.from('villes').delete().eq('id', id)
        if (error) {
          setErr(error.message)
          return
        }
        await load()
        onDataChange?.()
      },
    })
  }

  return (
    <>
      {err && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      )}
      <ul className="divide-y divide-[#E8E3D8] dark:divide-slate-700">
        {rows.length === 0 && !err ? (
          <li className="py-3 text-sm text-[#0F1923]/55 dark:text-slate-500">Aucune ville.</li>
        ) : (
          rows.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              <span className="font-medium text-[#0F1923] dark:text-slate-200">{v.nom}</span>
              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                className="cursor-pointer rounded-md p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                aria-label={`Supprimer ${v.nom}`}
              >
                <IconXSmall />
              </button>
            </li>
          ))
        )}
      </ul>
      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2 border-t border-[#E8E3D8] pt-4 dark:border-slate-700 sm:flex-row sm:items-end">
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la ville"
          className="min-w-0 flex-1 cursor-text rounded-lg border border-[#E8E3D8] bg-[#FAF6EF] px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="submit"
          className="cursor-pointer shrink-0 rounded-lg bg-[#D97B00] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c26a00]"
        >
          Ajouter
        </button>
      </form>
    </>
  )
}

function QuartiersModalBody({ villesOptions, onDataChange, openConfirm }) {
  const [villeId, setVilleId] = useState('')
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [nom, setNom] = useState('')

  const load = useCallback(async (vid) => {
    if (!vid) {
      setRows([])
      setErr(null)
      return
    }
    setErr(null)
    const { data, error } = await supabase.from('quartiers').select('*').eq('ville_id', vid).order('nom')
    if (error) {
      setErr(error.message)
      setRows([])
      return
    }
    setRows(data ?? [])
  }, [])

  useEffect(() => {
    load(villeId)
  }, [villeId, load])

  async function handleAdd(e) {
    e.preventDefault()
    const n = nom.trim()
    if (!n || !villeId) return
    setErr(null)
    const { error } = await supabase.from('quartiers').insert({ nom: n, ville_id: villeId })
    if (error) {
      setErr(error.message)
      return
    }
    setNom('')
    await load(villeId)
    onDataChange?.()
  }

  function handleDelete(id) {
    openConfirm({
      title: 'Supprimer ce quartier ?',
      message: '',
      onConfirm: async () => {
        setErr(null)
        const { error } = await supabase.from('quartiers').delete().eq('id', id)
        if (error) {
          setErr(error.message)
          return
        }
        await load(villeId)
        onDataChange?.()
      },
    })
  }

  return (
    <>
      <div className="mb-4">
        <label htmlFor="modal-quartier-ville" className="mb-1 block text-xs font-medium text-[#0F1923]/65 dark:text-slate-400">
          Ville
        </label>
        <select
          id="modal-quartier-ville"
          value={villeId}
          onChange={(e) => {
            setVilleId(e.target.value)
            setNom('')
          }}
          className="w-full cursor-pointer rounded-lg border border-[#E8E3D8] bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">— Choisir une ville —</option>
          {villesOptions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nom}
            </option>
          ))}
        </select>
      </div>
      {err && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      )}
      <ul className="divide-y divide-[#E8E3D8] dark:divide-slate-700">
        {!villeId ? (
          <li className="py-3 text-sm text-[#0F1923]/55 dark:text-slate-500">Sélectionnez une ville.</li>
        ) : rows.length === 0 && !err ? (
          <li className="py-3 text-sm text-[#0F1923]/55 dark:text-slate-500">Aucun quartier pour cette ville.</li>
        ) : (
          rows.map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              <span className="font-medium text-[#0F1923] dark:text-slate-200">{q.nom}</span>
              <button
                type="button"
                onClick={() => handleDelete(q.id)}
                className="cursor-pointer rounded-md p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                aria-label={`Supprimer ${q.nom}`}
              >
                <IconXSmall />
              </button>
            </li>
          ))
        )}
      </ul>
      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2 border-t border-[#E8E3D8] pt-4 dark:border-slate-700 sm:flex-row sm:items-end">
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom du quartier"
          disabled={!villeId}
          className="min-w-0 flex-1 cursor-text rounded-lg border border-[#E8E3D8] bg-[#FAF6EF] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={!villeId}
          className="cursor-pointer shrink-0 rounded-lg bg-[#D97B00] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c26a00] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>
    </>
  )
}

function TypesModalBody({ onDataChange, openConfirm }) {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState(null)
  const [nom, setNom] = useState('')

  const load = useCallback(async () => {
    setErr(null)
    const { data, error } = await supabase.from('types_biens').select('*').order('nom')
    if (error) {
      setErr(error.message)
      setRows([])
      return
    }
    setRows(data ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd(e) {
    e.preventDefault()
    const n = nom.trim()
    if (!n) return
    setErr(null)
    const { error } = await supabase.from('types_biens').insert({ nom: n })
    if (error) {
      setErr(error.message)
      return
    }
    setNom('')
    await load()
    onDataChange?.()
  }

  function handleDelete(id) {
    openConfirm({
      title: 'Supprimer ce type de bien ?',
      message: '',
      onConfirm: async () => {
        setErr(null)
        const { error } = await supabase.from('types_biens').delete().eq('id', id)
        if (error) {
          setErr(error.message)
          return
        }
        await load()
        onDataChange?.()
      },
    })
  }

  return (
    <>
      {err && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      )}
      <ul className="divide-y divide-[#E8E3D8] dark:divide-slate-700">
        {rows.length === 0 && !err ? (
          <li className="py-3 text-sm text-[#0F1923]/55 dark:text-slate-500">Aucun type.</li>
        ) : (
          rows.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              <span className="font-medium text-[#0F1923] dark:text-slate-200">{t.nom}</span>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="cursor-pointer rounded-md p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                aria-label={`Supprimer ${t.nom}`}
              >
                <IconXSmall />
              </button>
            </li>
          ))
        )}
      </ul>
      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2 border-t border-[#E8E3D8] pt-4 dark:border-slate-700 sm:flex-row sm:items-end">
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. Villa, Studio…"
          className="min-w-0 flex-1 cursor-text rounded-lg border border-[#E8E3D8] bg-[#FAF6EF] px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="submit"
          className="cursor-pointer shrink-0 rounded-lg bg-[#D97B00] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c26a00]"
        >
          Ajouter
        </button>
      </form>
    </>
  )
}

export default function ParametresPage() {
  const { user } = useUser()
  const [counts, setCounts] = useState({ villes: null, quartiers: null, types: null })
  const [villesForSelect, setVillesForSelect] = useState([])
  const [modal, setModal] = useState(null)
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmLabel: 'Confirmer',
    confirmVariant: 'danger',
  })

  const openConfirm = useCallback((opts) => {
    setConfirmState({
      open: true,
      title: opts.title ?? '',
      message: opts.message ?? '',
      onConfirm: opts.onConfirm ?? null,
      confirmLabel: opts.confirmLabel ?? 'Confirmer',
      confirmVariant: opts.confirmVariant ?? 'danger',
    })
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmState((s) => ({ ...s, open: false, onConfirm: null }))
  }, [])

  const handleConfirmModalConfirm = useCallback(() => {
    const fn = confirmState.onConfirm
    fn?.()
    closeConfirm()
  }, [confirmState, closeConfirm])

  const loadCounts = useCallback(async () => {
    const [v, q, t, villesList] = await Promise.all([
      supabase.from('villes').select('*', { count: 'exact', head: true }),
      supabase.from('quartiers').select('*', { count: 'exact', head: true }),
      supabase.from('types_biens').select('*', { count: 'exact', head: true }),
      supabase.from('villes').select('id, nom').order('nom'),
    ])
    setCounts({
      villes: v.count ?? 0,
      quartiers: q.count ?? 0,
      types: t.count ?? 0,
    })
    setVillesForSelect(villesList.data ?? [])
  }, [])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  function closeModal() {
    setModal(null)
    loadCounts()
  }

  const n = (c) => (c == null ? '…' : c)

  return (
    <div className="mx-auto max-w-3xl text-[#0F1923] dark:text-slate-100">
      <header className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight text-[#0F1923] dark:text-white"
          style={FONT_PLAYFAIR}
        >
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-[#0F1923]/65 dark:text-slate-400">
          Compte et données de référence ImmoCI.
        </p>
      </header>

      <div className="space-y-4">
        <section className="rounded-xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F1923]/55 dark:text-slate-400">
            Compte
          </h2>
          <p className="mt-3 text-sm">
            <span className="text-[#0F1923]/55 dark:text-slate-500">Email</span>
            <span className="ml-2 font-medium text-[#0F1923] dark:text-slate-200">{user?.email ?? '—'}</span>
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-[#E8E3D8] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-[#0F1923]/80 dark:text-slate-300">
            <span className="font-semibold tabular-nums text-[#0F1923] dark:text-white">{n(counts.villes)}</span>{' '}
            ville{counts.villes !== 1 ? 's' : ''} enregistrée{counts.villes !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => setModal('villes')}
            className="cursor-pointer self-start rounded-lg bg-[#D97B00] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#c26a00] sm:self-auto"
          >
            Gérer les villes
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-[#E8E3D8] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-[#0F1923]/80 dark:text-slate-300">
            <span className="font-semibold tabular-nums text-[#0F1923] dark:text-white">{n(counts.quartiers)}</span>{' '}
            quartier{counts.quartiers !== 1 ? 's' : ''} enregistré{counts.quartiers !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => setModal('quartiers')}
            className="cursor-pointer self-start rounded-lg bg-[#D97B00] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#c26a00] sm:self-auto"
          >
            Gérer les quartiers
          </button>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-[#E8E3D8] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-[#0F1923]/80 dark:text-slate-300">
            <span className="font-semibold tabular-nums text-[#0F1923] dark:text-white">{n(counts.types)}</span>{' '}
            type{counts.types !== 1 ? 's' : ''} enregistré{counts.types !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => setModal('types')}
            className="cursor-pointer self-start rounded-lg bg-[#D97B00] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#c26a00] sm:self-auto"
          >
            Gérer les types de biens
          </button>
        </section>
      </div>

      <GestionModal title="Villes" open={modal === 'villes'} onClose={closeModal}>
        <VillesModalBody onDataChange={loadCounts} openConfirm={openConfirm} />
      </GestionModal>

      <GestionModal title="Quartiers" open={modal === 'quartiers'} onClose={closeModal}>
        <QuartiersModalBody
          villesOptions={villesForSelect}
          onDataChange={loadCounts}
          openConfirm={openConfirm}
        />
      </GestionModal>

      <GestionModal title="Types de biens" open={modal === 'types'} onClose={closeModal}>
        <TypesModalBody onDataChange={loadCounts} openConfirm={openConfirm} />
      </GestionModal>

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        confirmVariant={confirmState.confirmVariant}
        onConfirm={handleConfirmModalConfirm}
        onCancel={closeConfirm}
      />
    </div>
  )
}
