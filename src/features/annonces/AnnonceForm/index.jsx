import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../../hooks/useUser.js'
import StepInfosBase from './StepInfosBase.jsx'
import StepDetails from './StepDetails.jsx'
import StepPhotos from './StepPhotos.jsx'
import StepLocalisation from './StepLocalisation.jsx'
import StepConfirmation from './StepConfirmation.jsx'
import {
  chargerDonneesReference,
  chargerQuartiers,
  creerAnnonce,
  uploadPhoto,
  enregistrerPhotos,
} from '../annoncesService.js'
import { EQUIPEMENT_DEFINITIONS, sanitizeFormDataForSubmit } from './annonceFormConfig.js'
import { supabase } from '../../../lib/supabase'

const STEPS = [
  'Infos de base',
  'Détails',
  'Photos',
  'Localisation',
  'Confirmation',
]

function buildInitialEquipements() {
  /** @type {Record<string, unknown>} */
  const out = {}
  for (const [key, def] of Object.entries(EQUIPEMENT_DEFINITIONS)) {
    if (def.type === 'boolean') out[key] = false
    else if (def.type === 'number') out[key] = ''
    else if (def.type === 'select' || def.type === 'text') out[key] = ''
  }
  return out
}

const initialForm = {
  titre: '',
  type_bien_id: '',
  transaction: '',
  prix: '',
  agence_id: '',
  ville_id: '',
  quartier_id: '',
  surface: '',
  chambres: '',
  salles_de_bain: '',
  adresse: '',
  description: '',
  equipements: buildInitialEquipements(),
  photos: [],
  latitude: null,
  longitude: null,
}

/**
 * Formulaire multi-étapes : création d’annonce + upload photos + redirection liste.
 */
export default function AnnonceForm() {
  const navigate = useNavigate()
  const { role, agenceId, agence } = useUser()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(initialForm)
  const [donneesRef, setDonneesRef] = useState({ typesBiens: [], villes: [], agences: [] })
  const [quartiers, setQuartiers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadRefError, setLoadRefError] = useState(null)

  const typeBienNom =
    donneesRef.typesBiens.find((t) => String(t.id) === String(formData.type_bien_id))?.nom ?? ''

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await chargerDonneesReference()
        if (!cancelled) setDonneesRef(data)
      } catch (e) {
        if (!cancelled) setLoadRefError(e.message ?? 'Impossible de charger les données de référence.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const donneesAffichees = useMemo(() => {
    if (role === 'agent' && agenceId) {
      return {
        ...donneesRef,
        agences: (donneesRef.agences ?? []).filter((a) => String(a.id) === String(agenceId)),
      }
    }
    return donneesRef
  }, [donneesRef, role, agenceId])

  /** Publication : réservée si l’agence de l’agent n’est pas encore validée par l’admin. */
  const canPublish = role !== 'agent' || agence?.verification_status === 'verified'

  const onVilleChange = useCallback(async (villeId) => {
    if (!villeId) {
      setQuartiers([])
      return
    }
    try {
      const q = await chargerQuartiers(villeId)
      setQuartiers(q)
    } catch {
      setQuartiers([])
    }
  }, [])

  async function handleSauvegarder(statut) {
    setLoading(true)
    setError(null)

    let agence_id = formData.agence_id
    if (role === 'agent' && agenceId) {
      agence_id = agenceId
    }
    if (!agence_id) {
      const { data } = await supabase.from('agences').select('id').eq('nom', 'OZ Immo').single()
      agence_id = data?.id ?? ''
    }

    const payload = sanitizeFormDataForSubmit({ ...formData, agence_id }, typeBienNom)
    const { annonce, error: erreurAnnonce } = await creerAnnonce({ ...payload, statut })

    if (erreurAnnonce) {
      setError('Erreur lors de la création : ' + erreurAnnonce.message)
      setLoading(false)
      return
    }

    if (formData.photos.length > 0) {
      const photosAvecUrls = []

      for (const photo of formData.photos) {
        const { url, error: erreurUpload } = await uploadPhoto(
          photo.file,
          agence_id,
          annonce.id
        )

        if (erreurUpload) {
          setError('Erreur upload photo : ' + erreurUpload.message)
          setLoading(false)
          return
        }

        photosAvecUrls.push({
          url: url,
          ordre: photo.ordre,
          is_principale: photo.is_principale,
        })
      }

      const { error: erreurPhotos } = await enregistrerPhotos(photosAvecUrls, annonce.id)

      if (erreurPhotos) {
        setError('Erreur enregistrement photos : ' + erreurPhotos.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    const liste = role === 'agent' ? '/agence/annonces' : '/admin/annonces'
    navigate(liste)
  }

  const pct = ((step - 1) / (STEPS.length - 1)) * 100

  if (loadRefError) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-800 dark:bg-red-950/40 dark:text-red-200">
        <p>{loadRefError}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs text-gray-600 dark:text-slate-400">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={
                i + 1 <= step ? 'font-semibold text-[#D97B00]' : 'text-slate-500 dark:text-slate-500'
              }
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{ width: `${pct}%`, backgroundColor: '#D97B00' }}
          />
        </div>
      </div>

      {step === 1 && (
        <StepInfosBase
          formData={formData}
          setFormData={setFormData}
          donneesRef={donneesAffichees}
          quartiers={quartiers}
          onVilleChange={onVilleChange}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepDetails
          formData={formData}
          setFormData={setFormData}
          typeBienNom={typeBienNom}
          onNext={() => setStep(3)}
          onPrev={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepPhotos
          formData={formData}
          setFormData={setFormData}
          onNext={() => setStep(4)}
          onPrev={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <StepLocalisation
          formData={formData}
          setFormData={setFormData}
          onNext={() => setStep(5)}
          onPrev={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <StepConfirmation
          formData={formData}
          donneesRef={donneesRef}
          quartiers={quartiers}
          loading={loading}
          error={error}
          canPublish={canPublish}
          onPublier={() => handleSauvegarder('publie')}
          onBrouillon={() => handleSauvegarder('brouillon')}
          onPrev={() => setStep(4)}
        />
      )}
    </div>
  )
}
