import { useCallback, useRef, useState } from 'react'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Compresse l'image (max 1920x1080, qualité 0.85) via Canvas - sans lib externe.
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxW = 1920
      const maxH = 1080
      let { width, height } = img
      const ratio = Math.min(maxW / width, maxH / height, 1)
      const w = Math.round(width * ratio)
      const h = Math.round(height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas non supporté'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression échouée'))
            return
          }
          const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
          resolve(new File([blob], name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image invalide'))
    }
    img.src = url
  })
}

/**
 * Étape 3 - Photos : compression, grille, réordonnancement drag & drop.
 */
export default function StepPhotos({ formData, setFormData, onNext, onPrev }) {
  const inputRef = useRef(null)
  const [dragIndex, setDragIndex] = useState(null)
  const [photoError, setPhotoError] = useState(null)

  const reordonner = useCallback(
    (photos, from, to) => {
      if (from === to || from < 0 || to < 0) return photos
      const next = [...photos]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next.map((p, i) => ({
        ...p,
        ordre: i,
        is_principale: i === 0,
        preview: p.preview,
      }))
    },
    []
  )

  const processFiles = async (filesRaw) => {
    setPhotoError(null)
    const files = Array.from(filesRaw || []).filter((f) => ACCEPT.includes(f.type))
    const added = []
    let hadProcessError = false
    for (const f of files) {
      try {
        const compressed = await compressImage(f)
        const preview = URL.createObjectURL(compressed)
        added.push({
          file: compressed,
          preview,
          ordre: 0,
          is_principale: false,
        })
      } catch {
        hadProcessError = true
      }
    }
    if (hadProcessError) {
      setPhotoError('Impossible de traiter une des images.')
    }
    if (added.length === 0) return
    setFormData((prev) => {
      const base = [...prev.photos, ...added]
      return {
        ...prev,
        photos: base.map((p, i) => ({
          ...p,
          ordre: i,
          is_principale: i === 0,
        })),
      }
    })
  }

  function onDropZone(e) {
    e.preventDefault()
    processFiles(e.dataTransfer.files)
  }

  function onFileInput(e) {
    processFiles(e.target.files)
    e.target.value = ''
  }

  function supprimer(index) {
    setFormData((prev) => {
      const next = prev.photos.filter((_, i) => i !== index)
      URL.revokeObjectURL(prev.photos[index]?.preview)
      return {
        ...prev,
        photos: next.map((p, i) => ({
          ...p,
          ordre: i,
          is_principale: i === 0,
        })),
      }
    })
  }

  function setPrincipale(index) {
    if (index === 0) return
    setFormData((prev) => {
      const next = reordonner(prev.photos, index, 0)
      return { ...prev, photos: next }
    })
  }

  function handleDragStart(i) {
    setDragIndex(i)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDropOn(i) {
    if (dragIndex === null || dragIndex === i) return
    setFormData((prev) => ({
      ...prev,
      photos: reordonner(prev.photos, dragIndex, i),
    }))
    setDragIndex(null)
  }

  function handleNext() {
    if (formData.photos.length < 1) {
      setPhotoError('Ajoutez au moins une photo.')
      return
    }
    setPhotoError(null)
    onNext()
  }

  return (
    <div className="max-w-4xl space-y-6 text-[#0F1923] dark:text-slate-200">
      {photoError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {photoError}
        </div>
      )}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropZone}
        className="rounded-xl border-2 border-dashed border-gray-300 bg-white/50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/50"
      >
        <p className="mb-4 text-sm text-gray-600 dark:text-slate-300">Glissez-déposez des images ou</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg px-4 py-2 font-medium text-white"
          style={{ backgroundColor: '#D97B00' }}
        >
          Ajouter des photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          multiple
          className="hidden"
          onChange={onFileInput}
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
          JPEG, PNG ou WebP - redimensionnement automatique
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {formData.photos.map((photo, i) => (
          <div
            key={`${photo.preview}-${i}`}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={handleDragOver}
            onDrop={() => handleDropOn(i)}
            className="relative aspect-video cursor-grab overflow-hidden rounded-lg border border-gray-200 bg-gray-100 active:cursor-grabbing dark:border-slate-600 dark:bg-slate-800"
            onClick={() => setPrincipale(i)}
          >
            <img src={photo.preview} alt="" className="w-full h-full object-cover" />
            {photo.is_principale && (
              <span
                className="absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: '#1D9E75' }}
              >
                Principale
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                supprimer(i)
              }}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white text-sm leading-7 hover:bg-black/80"
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-600 dark:text-slate-400">
        Cliquez sur une photo pour la mettre en couverture. Glissez pour réordonner.
      </p>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-[#D97B00] px-6 py-2 text-[#D97B00] dark:text-[#E8A54A]"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg px-6 py-2 font-medium text-white"
          style={{ backgroundColor: '#D97B00' }}
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
