import { createElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../hooks/useUser.js'
import { FORM_TYPE_CONFIG, TYPE_ORDER } from './forms/formTypesConfig.js'

export default function AnnonceTypeSelectionPage() {
  const navigate = useNavigate()
  const { role } = useUser()
  const prefix = role === 'agent' ? '/agence' : '/admin'

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: '"Inter", sans-serif' }}>
          Quel type de bien souhaitez-vous publier ?
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]" style={{ fontFamily: '"Inter", sans-serif' }}>
          Choisissez un type pour accéder au formulaire adapté.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TYPE_ORDER.map((slug) => {
          const cfg = FORM_TYPE_CONFIG[slug]
          return (
            <button
              key={slug}
              type="button"
              onClick={() => navigate(`${prefix}/annonces/new/${slug}`)}
              className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-left transition hover:border-[#E02020] hover:shadow-sm"
            >
              <div className="mb-4">{createElement(cfg.icon, { className: 'h-8 w-8 text-[#E02020]' })}</div>
              <h2 className="text-base font-semibold text-[#1A1A1A]" style={{ fontFamily: '"Inter", sans-serif' }}>
                {cfg.label}
              </h2>
              <p className="mt-1 text-xs text-[#6B7280]" style={{ fontFamily: '"Inter", sans-serif' }}>
                {cfg.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
