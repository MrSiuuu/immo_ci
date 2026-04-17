import { useState } from 'react'
import { getConfigForType, EQUIPEMENT_DEFINITIONS } from './annonceFormConfig.js'

const DEFAULT_BOOLEAN_KEYS = Object.keys(EQUIPEMENT_DEFINITIONS).filter(
  (k) => EQUIPEMENT_DEFINITIONS[k].type === 'boolean'
)

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[#0F1923] placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'
const labelClass = 'block text-sm font-medium mb-1 text-[#0F1923] dark:text-slate-200'
const inlineText = 'text-sm text-[#0F1923] dark:text-slate-200'
const checkboxClass =
  'h-4 w-4 shrink-0 rounded border-gray-400 text-[#D97B00] focus:ring-[#D97B00] dark:border-slate-500 dark:bg-slate-800'
const inputErrorClass = 'border-red-500 dark:border-red-400'

/** Clés rendues dans des blocs dédiés (Immeuble, Local commercial, Terrain). */
const EQUIPEMENT_KEYS_DEDICATED = new Set([
  'nombre_etages',
  'nombre_lots',
  'usage_commercial',
  'acces_route',
  'nom_route',
  'sous_bassement',
  'description_sous_bassement',
])

/**
 * Étape 2 — Détails du bien et équipements (checkboxes).
 */
export default function StepDetails({ formData, setFormData, typeBienNom, onNext, onPrev }) {
  const [fieldErrors, setFieldErrors] = useState({})

  const config = getConfigForType(typeBienNom)

  function isFieldVisible(fieldName) {
    if (!config) return true
    return !!config.fields[fieldName]?.visible
  }

  function clearFieldError(key) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function toggleEquip(key) {
    clearFieldError(key)
    setFormData((p) => ({
      ...p,
      equipements: { ...p.equipements, [key]: !p.equipements[key] },
    }))
  }

  function setEquipementValue(key, value) {
    clearFieldError(key)
    setFormData((p) => ({
      ...p,
      equipements: { ...p.equipements, [key]: value },
    }))
  }

  function validateAndNext() {
    if (!config) {
      setFieldErrors({})
      onNext()
      return
    }

    /** @type {Record<string, string>} */
    const errs = {}

    for (const [key, meta] of Object.entries(config.fields)) {
      if (!meta.required || !meta.visible) continue

      if (meta.storage === 'equipements') {
        const v = formData.equipements[key]
        if (v === '' || v === null || v === undefined) {
          errs[key] = 'Ce champ est obligatoire.'
        }
      } else {
        const v = formData[key]
        if (v === '' || v === null || v === undefined) {
          errs[key] = 'Ce champ est obligatoire.'
        }
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setFieldErrors({})
    onNext()
  }

  const equipKeysFiltered =
    config == null
      ? DEFAULT_BOOLEAN_KEYS
      : config.equipements.filter((key) => !EQUIPEMENT_KEYS_DEDICATED.has(key))

  function renderEquipementControl(key) {
    const def = EQUIPEMENT_DEFINITIONS[key]
    if (!def) return null

    if (def.type === 'boolean') {
      return (
        <label key={key} className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={!!formData.equipements[key]}
            onChange={() => toggleEquip(key)}
          />
          <span className={inlineText}>{def.label}</span>
        </label>
      )
    }

    if (def.type === 'number') {
      return (
        <div key={key}>
          <label className={labelClass}>{def.label}</label>
          <input
            type="number"
            min={0}
            value={formData.equipements[key] ?? ''}
            onChange={(e) => setEquipementValue(key, e.target.value)}
            className={`${inputClass} ${fieldErrors[key] ? inputErrorClass : ''}`}
          />
          {fieldErrors[key] && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors[key]}</p>}
        </div>
      )
    }

    if (def.type === 'select' && def.options) {
      return (
        <div key={key}>
          <label className={labelClass}>{def.label}</label>
          <select
            value={formData.equipements[key] ?? ''}
            onChange={(e) => setEquipementValue(key, e.target.value)}
            className={`${inputClass} ${fieldErrors[key] ? inputErrorClass : ''}`}
          >
            <option value="">— Choisir —</option>
            {def.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {fieldErrors[key] && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors[key]}</p>}
        </div>
      )
    }

    if (def.type === 'text') {
      return (
        <div key={key}>
          <label className={labelClass}>{def.label}</label>
          <input
            type="text"
            value={formData.equipements[key] ?? ''}
            onChange={(e) => setEquipementValue(key, e.target.value)}
            className={`${inputClass} ${fieldErrors[key] ? inputErrorClass : ''}`}
          />
          {fieldErrors[key] && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors[key]}</p>}
        </div>
      )
    }

    return null
  }

  const showImmeubleFields =
    config?.fields?.nombre_etages?.visible === true && config?.fields?.nombre_lots?.visible === true

  const showUsageCommercial = config?.fields?.usage_commercial?.visible === true

  return (
    <div className="max-w-2xl space-y-6 text-[#0F1923] dark:text-slate-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isFieldVisible('surface') && (
          <div>
            <label className={labelClass}>Surface (m²)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={formData.surface}
              onChange={(e) => {
                clearFieldError('surface')
                setFormData((p) => ({ ...p, surface: e.target.value }))
              }}
              className={`${inputClass} ${fieldErrors.surface ? inputErrorClass : ''}`}
            />
            {fieldErrors.surface && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.surface}</p>
            )}
          </div>
        )}
        {isFieldVisible('chambres') && (
          <div>
            <label className={labelClass}>Chambres</label>
            <input
              type="number"
              min={0}
              max={20}
              value={formData.chambres}
              onChange={(e) => {
                clearFieldError('chambres')
                setFormData((p) => ({ ...p, chambres: e.target.value }))
              }}
              className={`${inputClass} ${fieldErrors.chambres ? inputErrorClass : ''}`}
            />
            {fieldErrors.chambres && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.chambres}</p>
            )}
          </div>
        )}
        {isFieldVisible('salles_de_bain') && (
          <div>
            <label className={labelClass}>Salles de bain</label>
            <input
              type="number"
              min={0}
              max={10}
              value={formData.salles_de_bain}
              onChange={(e) => {
                clearFieldError('salles_de_bain')
                setFormData((p) => ({ ...p, salles_de_bain: e.target.value }))
              }}
              className={`${inputClass} ${fieldErrors.salles_de_bain ? inputErrorClass : ''}`}
            />
            {fieldErrors.salles_de_bain && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.salles_de_bain}</p>
            )}
          </div>
        )}
      </div>

      {showImmeubleFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Nombre d&apos;étages <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={formData.equipements.nombre_etages ?? ''}
              onChange={(e) => setEquipementValue('nombre_etages', e.target.value)}
              className={`${inputClass} ${fieldErrors.nombre_etages ? inputErrorClass : ''}`}
            />
            {fieldErrors.nombre_etages && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.nombre_etages}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Nombre de lots</label>
            <input
              type="number"
              min={0}
              value={formData.equipements.nombre_lots ?? ''}
              onChange={(e) => setEquipementValue('nombre_lots', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {showUsageCommercial && (
        <div>
          <label className={labelClass}>
            {EQUIPEMENT_DEFINITIONS.usage_commercial.label}{' '}
            <span className="text-red-600">*</span>
          </label>
          <select
            value={formData.equipements.usage_commercial ?? ''}
            onChange={(e) => setEquipementValue('usage_commercial', e.target.value)}
            className={`${inputClass} ${fieldErrors.usage_commercial ? inputErrorClass : ''}`}
          >
            <option value="">— Choisir —</option>
            {EQUIPEMENT_DEFINITIONS.usage_commercial.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {fieldErrors.usage_commercial && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.usage_commercial}</p>
          )}
        </div>
      )}

      {isFieldVisible('adresse') && (
        <div>
          <label className={labelClass}>Adresse</label>
          <input
            type="text"
            value={formData.adresse}
            onChange={(e) => {
              clearFieldError('adresse')
              setFormData((p) => ({ ...p, adresse: e.target.value }))
            }}
            className={`${inputClass} ${fieldErrors.adresse ? inputErrorClass : ''}`}
          />
          {fieldErrors.adresse && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.adresse}</p>
          )}
        </div>
      )}

      {isFieldVisible('description') && (
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => {
              clearFieldError('description')
              setFormData((p) => ({ ...p, description: e.target.value }))
            }}
            className={`${inputClass} min-h-[120px] ${fieldErrors.description ? inputErrorClass : ''}`}
          />
          {fieldErrors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.description}</p>
          )}
        </div>
      )}

      {typeBienNom === 'Terrain' && config && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-[#FAF6EF]/80 p-4 dark:border-slate-600 dark:bg-slate-800/50">
          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={!!formData.equipements.acces_route}
                onChange={(e) => {
                  const on = e.target.checked
                  clearFieldError('acces_route')
                  setFormData((p) => ({
                    ...p,
                    equipements: {
                      ...p.equipements,
                      acces_route: on,
                      ...(on ? {} : { nom_route: '' }),
                    },
                  }))
                }}
              />
              <span className="text-sm font-medium text-[#0F1923] dark:text-slate-200">
                {EQUIPEMENT_DEFINITIONS.acces_route.label}
              </span>
            </label>
            {formData.equipements.acces_route && (
              <div className="mt-2 pl-6">
                <label className={labelClass}>
                  {EQUIPEMENT_DEFINITIONS.nom_route.label}
                </label>
                <input
                  type="text"
                  value={formData.equipements.nom_route ?? ''}
                  onChange={(e) => setEquipementValue('nom_route', e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={!!formData.equipements.sous_bassement}
                onChange={(e) => {
                  const on = e.target.checked
                  clearFieldError('sous_bassement')
                  setFormData((p) => ({
                    ...p,
                    equipements: {
                      ...p.equipements,
                      sous_bassement: on,
                      ...(on ? {} : { description_sous_bassement: '' }),
                    },
                  }))
                }}
              />
              <span className="text-sm font-medium text-[#0F1923] dark:text-slate-200">
                {EQUIPEMENT_DEFINITIONS.sous_bassement.label}
              </span>
            </label>
            {formData.equipements.sous_bassement && (
              <div className="mt-2 pl-6">
                <label className={labelClass}>
                  {EQUIPEMENT_DEFINITIONS.description_sous_bassement.label}
                </label>
                <textarea
                  rows={3}
                  value={formData.equipements.description_sous_bassement ?? ''}
                  onChange={(e) => setEquipementValue('description_sous_bassement', e.target.value)}
                  className={`${inputClass} min-h-[80px] resize-y`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <span className="mb-2 block text-sm font-medium text-[#0F1923] dark:text-slate-200">Équipements</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {equipKeysFiltered.map((key) => renderEquipementControl(key))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-[#D97B00] px-6 py-2 text-[#D97B00] dark:border-[#D97B00] dark:text-[#E8A54A]"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={validateAndNext}
          className="rounded-lg px-6 py-2 font-medium text-white"
          style={{ backgroundColor: '#D97B00' }}
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
