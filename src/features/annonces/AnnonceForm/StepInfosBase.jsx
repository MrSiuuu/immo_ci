import { useState } from 'react'

/**
 * Étape 1 — Infos de base (titre, type, transaction, prix, agence, commune, quartier).
 */

const label = 'block text-sm font-medium mb-1 text-[#0F1923] dark:text-slate-200'
const field =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[#0F1923] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
const errText = 'mt-1 text-sm text-red-600 dark:text-red-400'

export default function StepInfosBase({
  formData,
  setFormData,
  donneesRef,
  quartiers,
  onVilleChange,
  onNext,
}) {
  const [errors, setErrors] = useState({})

  function validate() {
    const next = {}
    const titre = (formData.titre || '').trim()
    if (titre.length < 10) {
      next.titre = 'Le titre doit contenir au moins 10 caractères.'
    }
    if (!formData.type_bien_id) {
      next.type_bien_id = 'Choisissez un type de bien.'
    }
    if (!formData.transaction) {
      next.transaction = 'Choisissez un type de transaction.'
    }
    const prix = Number(formData.prix)
    if (!Number.isFinite(prix) || prix <= 0) {
      next.prix = 'Le prix doit être supérieur à 0 FCFA.'
    }
    if (!formData.ville_id) {
      next.ville_id = 'Choisissez une commune.'
    }
    return next
  }

  function clearError(key) {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const n = { ...prev }
      delete n[key]
      return n
    })
  }

  function handleNext() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length === 0) onNext()
  }

  return (
    <div className="max-w-2xl space-y-6 text-[#0F1923] dark:text-slate-100">
      <div>
        <label className={label}>Titre de l&apos;annonce *</label>
        <input
          type="text"
          value={formData.titre}
          onChange={(e) => {
            clearError('titre')
            setFormData((p) => ({ ...p, titre: e.target.value }))
          }}
          className={field}
          minLength={10}
        />
        {errors.titre && <p className={errText}>{errors.titre}</p>}
      </div>

      <div>
        <label className={label}>Type de bien *</label>
        <select
          value={formData.type_bien_id}
          onChange={(e) => {
            clearError('type_bien_id')
            setFormData((p) => ({ ...p, type_bien_id: e.target.value }))
          }}
          className={field}
        >
          <option value="">— Sélectionner —</option>
          {donneesRef.typesBiens.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nom}
            </option>
          ))}
        </select>
        {errors.type_bien_id && <p className={errText}>{errors.type_bien_id}</p>}
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-[#0F1923] dark:text-slate-200">
          Transaction *
        </span>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'louer', label: 'Louer' },
            { value: 'vendre', label: 'Vendre' },
            { value: 'bail', label: 'Bail' },
          ].map((opt) => (
            <label
              key={opt.value}
              className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#0F1923] dark:text-slate-200"
            >
              <input
                type="radio"
                name="transaction"
                value={opt.value}
                checked={formData.transaction === opt.value}
                onChange={() => {
                  clearError('transaction')
                  setFormData((p) => ({ ...p, transaction: opt.value }))
                }}
                className="border-gray-400 text-[#D97B00] focus:ring-[#D97B00] dark:border-slate-500 dark:bg-slate-800"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        {errors.transaction && <p className={errText}>{errors.transaction}</p>}
      </div>

      <div>
        <label className={label}>Prix (FCFA) *</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step={1}
            value={formData.prix}
            onChange={(e) => {
              clearError('prix')
              setFormData((p) => ({ ...p, prix: e.target.value }))
            }}
            className={`${field} flex-1`}
          />
          <span className="shrink-0 text-sm text-gray-600 dark:text-slate-400">FCFA</span>
        </div>
        {errors.prix && <p className={errText}>{errors.prix}</p>}
      </div>

      <div>
        <label className={label}>Agence (optionnel)</label>
        <select
          value={formData.agence_id}
          onChange={(e) => setFormData((p) => ({ ...p, agence_id: e.target.value }))}
          className={field}
        >
          <option value="">— Sélectionner —</option>
          {donneesRef.agences.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>Commune *</label>
        <select
          value={formData.ville_id}
          onChange={(e) => {
            const vid = e.target.value
            clearError('ville_id')
            setFormData((p) => ({ ...p, ville_id: vid, quartier_id: '' }))
            onVilleChange(vid)
          }}
          className={field}
        >
          <option value="">— Sélectionner —</option>
          {donneesRef.villes.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nom}
            </option>
          ))}
        </select>
        {errors.ville_id && <p className={errText}>{errors.ville_id}</p>}
      </div>

      {formData.ville_id && quartiers.length > 0 && (
        <div>
          <label className={label}>Quartier</label>
          <select
            value={formData.quartier_id}
            onChange={(e) => setFormData((p) => ({ ...p, quartier_id: e.target.value }))}
            className={field}
          >
            <option value="">— Sélectionner —</option>
            {quartiers.map((q) => (
              <option key={q.id} value={q.id}>
                {q.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleNext}
          className="cursor-pointer rounded-lg px-6 py-2 font-medium text-white"
          style={{ backgroundColor: '#D97B00' }}
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
