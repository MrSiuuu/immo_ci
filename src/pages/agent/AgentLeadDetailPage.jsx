import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { displayOrDash } from '../../lib/displayOrDash'
import { useUser } from '../../hooks/useUser'
import { formatLeadDate, phoneDigitsForWa, sourceBadgeClass, sourceLabel } from '../../lib/leadDisplay.js'

const cardClass = 'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'

export default function AgentLeadDetailPage() {
  const { id } = useParams()
  const { agenceId } = useUser()
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id || !agenceId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('contacts')
        .select('id, nom, email, telephone, message, source, created_at, annonce_id, annonces(titre, id)')
        .eq('id', id)
        .eq('agence_id', agenceId)
        .single()
      if (cancelled) return
      if (err || !data) {
        setError(err?.message ?? 'Lead introuvable.')
        setRow(null)
      } else {
        setRow(data)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id, agenceId])

  if (!agenceId) {
    return <p className="text-sm text-[#6B7280]">Aucune agence associée à ce compte.</p>
  }

  if (loading) {
    return <p className="text-sm text-[#6B7280]">Chargement…</p>
  }

  if (error || !row) {
    return (
      <div className="space-y-4" style={{ fontFamily: '"Inter", sans-serif' }}>
        <Link to="/agence/contacts" className="inline-flex items-center gap-2 text-sm text-[#E02020] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour aux contacts
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error ?? 'Lead introuvable.'}</p>
      </div>
    )
  }

  const source = row.source || 'formulaire'
  const annonceId = row.annonces?.id ?? row.annonce_id
  const waDigits = phoneDigitsForWa(row.telephone)
  const waText = encodeURIComponent(
    `Bonjour ${row.nom ?? ''}, nous avons bien reçu votre demande concernant l'annonce « ${row.annonces?.titre ?? ''} ».`,
  )
  const waHref = waDigits ? `https://wa.me/${waDigits}?text=${waText}` : null
  const telHref = row.telephone ? `tel:${row.telephone}` : null
  const mailHref = row.email ? `mailto:${row.email}` : null

  return (
    <div className="space-y-6 text-[#111827]" style={{ fontFamily: '"Inter", sans-serif' }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/agence/contacts" className="inline-flex items-center gap-2 text-sm font-medium text-[#E02020] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour aux contacts
        </Link>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sourceBadgeClass(source)}`}>{sourceLabel(source)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Prospect</h2>
          <p className="mt-3 text-xl font-semibold text-[#111827]">{displayOrDash(row.nom)}</p>
          <p className="mt-2 text-sm text-[#374151]">{displayOrDash(row.email)}</p>
          <p className="mt-1 text-sm text-[#6B7280]">{displayOrDash(row.telephone)}</p>
          <dl className="mt-4 space-y-2 border-t border-[#F3F4F6] pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6B7280]">Source</dt>
              <dd className="font-medium">{sourceLabel(source)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6B7280]">Date</dt>
              <dd className="font-medium">{formatLeadDate(row.created_at)}</dd>
            </div>
          </dl>
        </section>

        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Annonce concernée</h2>
          <p className="mt-3 text-lg font-semibold text-[#111827]">{displayOrDash(row.annonces?.titre)}</p>
          {annonceId ? (
            <Link to={`/agence/annonces/${annonceId}`} className="mt-2 inline-block text-sm text-[#E02020] hover:underline">
              Voir l&apos;annonce
            </Link>
          ) : null}
        </section>
      </div>

      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Message complet</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">{displayOrDash(row.message)}</p>
      </section>

      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Actions rapides</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16A34A]"
            >
              Contacter sur WhatsApp
            </a>
          ) : (
            <span className="inline-flex cursor-not-allowed items-center rounded-full bg-[#E5E7EB] px-4 py-2 text-sm text-[#9CA3AF]">
              Contacter sur WhatsApp
            </span>
          )}
          {telHref ? (
            <a
              href={telHref}
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F9FAFB]"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Appeler
            </a>
          ) : (
            <span className="inline-flex cursor-not-allowed items-center rounded-full border border-[#E5E7EB] px-4 py-2 text-sm text-[#9CA3AF]">
              Appeler
            </span>
          )}
          {mailHref ? (
            <a
              href={mailHref}
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F9FAFB]"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Envoyer un email
            </a>
          ) : (
            <span className="inline-flex cursor-not-allowed items-center rounded-full border border-[#E5E7EB] px-4 py-2 text-sm text-[#9CA3AF]">
              Envoyer un email
            </span>
          )}
        </div>
      </section>
    </div>
  )
}
