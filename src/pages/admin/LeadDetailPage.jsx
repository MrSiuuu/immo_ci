import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { displayOrDash } from '../../lib/displayOrDash'
import { formatLeadDate, sourceBadgeClass, sourceLabel } from '../../lib/leadDisplay.js'

const cardClass = 'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'

export default function LeadDetailPage() {
  const { id } = useParams()
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('contacts')
        .select('id, nom, email, telephone, message, source, created_at, annonce_id, agence_id, annonces(titre, id), agences(nom)')
        .eq('id', id)
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
  }, [id])

  if (loading) {
    return <p className="text-sm text-[#6B7280]">Chargement…</p>
  }

  if (error || !row) {
    return (
      <div className="space-y-4">
        <Link to="/admin/leads" className="inline-flex items-center gap-2 text-sm text-[#E02020] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour aux leads
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error ?? 'Lead introuvable.'}</p>
      </div>
    )
  }

  const source = row.source || 'formulaire'
  const annonceId = row.annonces?.id ?? row.annonce_id
  const agenceId = row.agence_id

  return (
    <div className="space-y-6 text-[#111827]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/leads" className="inline-flex items-center gap-2 text-sm font-medium text-[#E02020] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour aux leads
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

        <section className={`${cardClass} space-y-6`}>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Annonce concernée</h2>
            <p className="mt-3 text-lg font-semibold text-[#111827]">{displayOrDash(row.annonces?.titre)}</p>
            {annonceId ? (
              <Link to={`/admin/annonces/${annonceId}`} className="mt-2 inline-block text-sm text-[#E02020] hover:underline">
                Voir l&apos;annonce
              </Link>
            ) : null}
          </div>
          <div className="border-t border-[#F3F4F6] pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Agence</h2>
            <p className="mt-3 text-lg font-semibold text-[#111827]">{displayOrDash(row.agences?.nom)}</p>
            {agenceId ? (
              <Link to={`/admin/agences/${agenceId}`} className="mt-2 inline-block text-sm text-[#E02020] hover:underline">
                Voir l&apos;agence
              </Link>
            ) : null}
          </div>
        </section>
      </div>

      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Message complet</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">{displayOrDash(row.message)}</p>
      </section>
    </div>
  )
}
