/**
 * Étape 5 - Récapitulatif et publication / brouillon.
 */
import { displayOrDash } from '../../../lib/displayOrDash'

export default function StepConfirmation({
  formData,
  donneesRef,
  quartiers,
  loading,
  error,
  canPublish = true,
  onPublier,
  onBrouillon,
  onPrev,
}) {
  const typeNom =
    displayOrDash(donneesRef.typesBiens.find((t) => String(t.id) === String(formData.type_bien_id))?.nom)
  const villeNom =
    displayOrDash(donneesRef.villes.find((v) => String(v.id) === String(formData.ville_id))?.nom)
  const quartierNom =
    displayOrDash(quartiers.find((q) => String(q.id) === String(formData.quartier_id))?.nom)

  const txLabels = { louer: 'Louer', vendre: 'Vendre', bail: 'Bail' }
  const tx = txLabels[formData.transaction] ?? formData.transaction

  const prixNum = Number(formData.prix)
  const prixFormate = Number.isFinite(prixNum)
    ? `${new Intl.NumberFormat('fr-FR').format(prixNum)} FCFA`
    : displayOrDash(null)

  const photoPrincipale = formData.photos[0]

  return (
    <div className="max-w-2xl space-y-6 text-[#0F1923] dark:text-slate-100">
      <h2
        className="text-xl font-semibold text-[#0F1923] dark:text-white"
        style={{ fontFamily: '"Playfair Display", serif' }}
      >
        Récapitulatif
      </h2>

      {photoPrincipale && (
        <div className="h-32 w-48 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-600">
          <img src={photoPrincipale.preview} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <ul className="space-y-2 text-sm text-[#0F1923] dark:text-slate-200">
        <li>
          <strong className="text-[#0F1923] dark:text-slate-100">Titre :</strong> {displayOrDash(formData.titre)}
        </li>
        <li>
          <strong className="text-[#0F1923] dark:text-slate-100">Transaction :</strong> {tx} ·{' '}
          <strong>Type :</strong> {typeNom}
        </li>
        <li>
          <strong>Prix :</strong> {prixFormate}
        </li>
        <li>
          <strong>Ville :</strong> {villeNom} · <strong>Quartier :</strong> {quartierNom}
        </li>
        <li>
          <strong>Photos :</strong> {formData.photos.length}
        </li>
        <li>
          {formData.latitude != null && formData.longitude != null ? (
            <span className="font-medium text-[#1D9E75] dark:text-emerald-400">Localisation ajoutée ✓</span>
          ) : (
            <span className="text-gray-500 dark:text-slate-400">Pas de localisation sur la carte</span>
          )}
        </li>
      </ul>

      {error && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      )}

      {!canPublish && (
        <p className="rounded-lg border border-amber-200 bg-[#FAEEDA] px-3 py-2 text-sm text-[#854F0B]">
          Votre agence est en cours de vérification. Vous pouvez enregistrer en brouillon, mais la publication
          restera désactivée tant que votre agence n&apos;est pas validée par l&apos;administrateur.
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="button"
          disabled={loading}
          onClick={onBrouillon}
          className="rounded-lg border border-[#D97B00] px-4 py-2 text-[#D97B00] disabled:opacity-50 dark:text-[#E8A54A]"
        >
          Enregistrer en brouillon
        </button>
        <button
          type="button"
          disabled={loading || !canPublish}
          onClick={onPublier}
          className="rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: '#D97B00' }}
          title={!canPublish ? 'Publication indisponible tant que l’agence n’est pas vérifiée' : undefined}
        >
          {loading ? 'Enregistrement…' : 'Publier maintenant'}
        </button>
        {loading && (
          <span
            className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#D97B00] border-t-transparent"
            aria-hidden
          />
        )}
      </div>

      <button
        type="button"
        onClick={onPrev}
        className="text-sm text-[#D97B00] underline dark:text-[#E8A54A]"
      >
        ← Précédent
      </button>
    </div>
  )
}
