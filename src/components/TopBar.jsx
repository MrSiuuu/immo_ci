import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Plus } from 'lucide-react'
import { useUser } from '../hooks/useUser'

const FONT_PLAYFAIR = { fontFamily: '"Playfair Display", serif' }

/**
 * Barre supérieure admin : titre + date, nouvelle agence, notifications.
 */
export default function TopBar({ title }) {
  const { user, role } = useUser()
  const isAdmin = role === 'admin'

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
        {isAdmin ? (
          <Link
            to="/admin/agences/new"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#D97B00] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#c26a00] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Nouvelle agence
          </Link>
        ) : null}
        <button
          type="button"
          className="relative mr-2 cursor-pointer rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D97B00] ring-2 ring-white dark:ring-gray-900" />
        </button>
      </div>
    </header>
  )
}
