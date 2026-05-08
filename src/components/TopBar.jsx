import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Plus } from 'lucide-react'
import { useUser } from '../hooks/useUser'
import { supabase } from '../lib/supabase'

const FONT_PLAYFAIR = { fontFamily: '"Playfair Display", serif' }

/**
 * Barre supérieure admin : titre + date, nouvelle agence, notifications.
 */
export default function TopBar({ title }) {
  const { user, role } = useUser()
  const navigate = useNavigate()
  const isAdmin = role === 'admin'
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  useEffect(() => {
    if (!isAdmin || !user?.id) return
    let cancelled = false
    async function loadNotifs() {
      const { data } = await supabase
        .from('notifications')
        .select('id, message, created_at, is_read, lien')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10)
      if (!cancelled) setNotifications(data ?? [])
    }
    loadNotifs()
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        loadNotifs()
      })
      .subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [isAdmin, user?.id])

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
          onClick={() => setOpen((v) => !v)}
          className="relative mr-2 cursor-pointer rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          {notifications.length > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E02020] px-1 text-[10px] text-white">
              {notifications.length}
            </span>
          ) : null}
        </button>
        {open ? (
          <div className="absolute right-6 top-12 z-50 w-[360px] rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-lg">
            <p className="px-2 py-1 text-xs font-semibold text-[#111827]">Notifications non lues</p>
            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[#6B7280]">Aucune notification.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={async () => {
                      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
                      setOpen(false)
                      navigate('/admin/annonces?quick=en_attente_validation')
                    }}
                    className="w-full rounded-lg px-2 py-2 text-left hover:bg-[#F8F8F8]"
                  >
                    <p className="text-xs text-[#111827]">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-[#6B7280]">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
