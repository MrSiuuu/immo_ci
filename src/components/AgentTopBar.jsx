import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

const FONT_INTER = { fontFamily: '"Inter", sans-serif' }

/**
 * Barre supérieure - espace agent (titre + nouvelle annonce).
 */
export default function AgentTopBar({ title }) {
  const navigate = useNavigate()

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 transition-colors duration-200 dark:border-gray-700 dark:bg-gray-900">
      <div className="min-w-0">
        <h1
          style={FONT_INTER}
          className="text-base font-semibold leading-tight text-[#0F1923] dark:text-white"
        >
          {title}
        </h1>
      </div>

      <button
        type="button"
        data-tour="agent-topbar-new"
        onClick={() => navigate('/agence/annonces/new')}
        className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-[#E02020] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c81d1d] active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
        Nouvelle annonce
      </button>
    </header>
  )
}
