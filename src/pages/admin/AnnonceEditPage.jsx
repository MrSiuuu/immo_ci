import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const FONT_PLAYFAIR = { fontFamily: '"Playfair Display", serif' }

const STATUT_OPTIONS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'publie', label: 'Publié' },
  { value: 'reserve', label: 'Réservé' },
  { value: 'vendu', label: 'Vendu' },
  { value: 'loue', label: 'Loué' },
]

const inputClass =
  'w-full rounded-lg border border-[#E8E3D8] bg-white px-3 py-2.5 text-sm text-[#0F1923] focus:outline-none focus:ring-2 focus:ring-[#D97B00] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

/**
 * Édition rapide d'une annonce (hors flux multi-étapes).
 */
export default function AnnonceEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [initialError, setInitialError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [titre, setTitre] = useState('')
  const [statut, setStatut] = useState('brouillon')
  const [prix, setPrix] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setInitialError(null)
      const { data, error: err } = await supabase
        .from('annonces')
        .select('id, titre, statut, prix, description')
        .eq('id', id)
        .single()

      if (cancelled) return
      if (err || !data) {
        setInitialError(err?.message ?? 'Annonce introuvable.')
        setLoading(false)
        return
      }
      setTitre(data.titre ?? '')
      setStatut(data.statut ?? 'brouillon')
      setPrix(data.prix != null ? String(data.prix) : '')
      setDescription(data.description ?? '')
      setLoading(false)
    }

    if (id) load()
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const prixNum = Number(prix)
    const { error: err } = await supabase
      .from('annonces')
      .update({
        titre: titre.trim(),
        statut,
        prix: Number.isFinite(prixNum) ? prixNum : null,
        description: description.trim() || null,
      })
      .eq('id', id)

    setSaving(false)
    if (err) {
      setError(err.message ?? 'Enregistrement impossible.')
      return
    }
    navigate('/admin/annonces')
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    setError(null)
    const { error: err } = await supabase.from('annonces').delete().eq('id', id)
    setDeleting(false)
    setShowDeleteModal(false)
    if (err) {
      setError(err.message ?? 'Suppression impossible.')
      return
    }
    navigate('/admin/annonces')
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#0F1923]/70 dark:text-slate-400">
        Chargement…
      </div>
    )
  }

  if (!loading && initialError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {initialError}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1
          className="text-2xl font-semibold tracking-tight text-[#0F1923] dark:text-white"
          style={FONT_PLAYFAIR}
        >
          Modifier l&apos;annonce
        </h1>
        <p className="mt-1 text-sm text-[#0F1923]/65 dark:text-slate-400">
          Ajustez les informations principales puis enregistrez.
        </p>

        {error && (
          <p
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div>
            <label htmlFor="edit-titre" className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">
              Titre
            </label>
            <input
              id="edit-titre"
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-statut" className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">
              Statut
            </label>
            <select
              id="edit-statut"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className={inputClass}
            >
              {STATUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-prix" className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">
              Prix (FCFA)
            </label>
            <input
              id="edit-prix"
              type="number"
              min={0}
              step={1}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="edit-desc" className="mb-1.5 block text-sm font-medium text-[#0F1923] dark:text-slate-200">
              Description
            </label>
            <textarea
              id="edit-desc"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} min-h-[140px] resize-y`}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-[#E8E3D8] pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-slate-700">
            <button
              type="button"
              onClick={() => navigate('/admin/annonces')}
              className="order-2 rounded-lg border border-[#E8E3D8] px-4 py-2.5 text-sm font-medium text-[#0F1923] transition hover:bg-[#FAF6EF] dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 sm:order-1"
            >
              Annuler
            </button>
            <div className="order-1 flex flex-col gap-3 sm:order-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Supprimer
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#D97B00] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#c26a00] disabled:opacity-60"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-xl dark:border-slate-600 dark:bg-slate-900">
            <h2 id="delete-dialog-title" className="text-lg font-semibold text-[#0F1923] dark:text-white">
              Supprimer cette annonce ?
            </h2>
            <p className="mt-2 text-sm text-[#0F1923]/70 dark:text-slate-400">
              Cette action est définitive. L&apos;annonce sera retirée de la liste.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-lg border border-[#E8E3D8] px-4 py-2 text-sm font-medium text-[#0F1923] dark:border-slate-600 dark:text-slate-200"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
