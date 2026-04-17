/**
 * Modale de confirmation réutilisable (remplace alert/confirm natifs).
 */
export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmer',
  confirmVariant = 'danger',
}) {
  if (!open) return null

  const confirmBtnClass =
    confirmVariant === 'primary'
      ? 'bg-[#D97B00] text-white hover:bg-[#c26a00]'
      : 'bg-[#C0392B] text-white hover:bg-[#a93226]'

  function handleOverlayClick() {
    onCancel?.()
  }

  function handleConfirm() {
    onConfirm?.()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-pointer"
        onClick={handleOverlayClick}
        aria-label="Fermer"
      />
      <div
        className="relative z-10 w-full max-w-sm cursor-default rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-modal-title"
          className="text-lg font-semibold text-[#0F1923] dark:text-white"
        >
          {title}
        </h2>
        {message && (
          <p className="mt-2 text-sm text-[#0F1923]/80 dark:text-slate-300">{message}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="cursor-pointer rounded-lg border border-[#D97B00] px-4 py-2 text-sm font-medium text-[#D97B00] transition hover:bg-[#D97B00]/10 dark:hover:bg-[#D97B00]/20"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${confirmBtnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
