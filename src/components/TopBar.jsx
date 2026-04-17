import { useMemo } from 'react'
import { useUser } from '../hooks/useUser'

const FONT_PLAYFAIR = { fontFamily: '"Playfair Display", serif' }

function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Barre supérieure : titre + date, actions.
 */
export default function TopBar({ title }) {
  const { user } = useUser()

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  return (
    <header
      key={user?.id ?? 'session'}
      className="flex h-[52px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 transition-colors duration-200 dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="min-w-0">
        <h1
          style={FONT_PLAYFAIR}
          className="text-base font-semibold leading-tight text-[#0F1923] dark:text-white"
        >
          {title}
        </h1>
        <p className="mt-0.5 text-[10px] capitalize leading-none text-gray-500 dark:text-gray-400">
          {dateLabel}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-[#D97B00] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#c26a00] active:scale-[0.98]"
        >
          Nouvelle agence
        </button>
        <button
          type="button"
          className="relative mr-2 cursor-pointer rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Notifications"
        >
          <IconBell />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D97B00] ring-2 ring-white dark:ring-gray-900" />
        </button>
      </div>
    </header>
  )
}
