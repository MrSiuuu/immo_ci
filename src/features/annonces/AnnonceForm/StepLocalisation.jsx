import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Correction des chemins d’icônes Leaflet avec Vite
if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const ABIDJAN = { lat: 5.3599517, lng: -4.0082563 }

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/**
 * Étape 4 - Carte Leaflet : clic pour placer le marqueur (optionnel).
 */
export default function StepLocalisation({ formData, setFormData, onNext, onPrev }) {
  const position = useMemo(() => {
    if (formData.latitude != null && formData.longitude != null) {
      return [formData.latitude, formData.longitude]
    }
    return [ABIDJAN.lat, ABIDJAN.lng]
  }, [formData.latitude, formData.longitude])

  function onPick(lat, lng) {
    setFormData((p) => ({ ...p, latitude: lat, longitude: lng }))
  }

  function passerEtape() {
    onNext()
  }

  return (
    <div className="max-w-3xl space-y-4 text-[#0F1923] dark:text-slate-200">
      <p className="text-sm text-gray-600 dark:text-slate-300">
        Cliquez sur la carte pour indiquer l’emplacement du bien (optionnel).
      </p>

      <div className="z-0 h-[400px] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-slate-600">
        <MapContainer center={position} zoom={12} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={onPick} />
          {formData.latitude != null && formData.longitude != null && (
            <Marker position={[formData.latitude, formData.longitude]} />
          )}
        </MapContainer>
      </div>

      {formData.latitude != null && formData.longitude != null && (
        <p className="text-sm text-[#0F1923] dark:text-slate-200">
          Coordonnées : {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-2 pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-[#D97B00] px-6 py-2 text-[#D97B00] dark:text-[#E8A54A]"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={passerEtape}
          className="rounded-lg border border-gray-400 px-4 py-2 text-gray-700 dark:border-slate-500 dark:text-slate-200"
        >
          Passer cette étape
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg px-6 py-2 font-medium text-white"
          style={{ backgroundColor: '#D97B00' }}
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
