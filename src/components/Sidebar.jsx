import { createElement, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { useUser } from '../hooks/useUser'
import { deconnexion } from '../features/auth/authService'
import { supabase } from '../lib/supabase'

const FONT_PLAYFAIR = { fontFamily: '"Playfair Display", serif' }

const linkShell =
  'group flex cursor-pointer items-center gap-3 rounded-r-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200'

const linkActive =
  `${linkShell} ml-2 max-w-max self-start border-[#E02020] bg-[#E02020] text-white`

const linkInactive =
  `${linkShell} mx-2 w-[calc(100%-1rem)] border-transparent text-[#111111]/70 hover:bg-[#F8F8F8] hover:text-[#111111]`

function NavItem({ to, end, icon, children, badge, badgeVariant = 'neutral', disabled = false, tooltip = '' }) {
  if (disabled) {
    return (
      <div
        className={`${linkInactive} cursor-not-allowed opacity-50`}
        title={tooltip}
        role="link"
        aria-disabled="true"
      >
        <span className="flex min-w-0 items-center gap-3">
          {createElement(icon, { className: 'h-5 w-5 shrink-0', 'aria-hidden': true })}
          {children}
        </span>
        {badge != null ? (
          <span className="ml-auto shrink-0 rounded-full bg-[#E02020] px-2 py-0.5 text-[8px] font-semibold uppercase text-white">
            {badge}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? linkActive : linkInactive)}>
      <span className="flex min-w-0 items-center gap-3">
        {createElement(icon, { className: 'h-5 w-5 shrink-0', 'aria-hidden': true })}
        {children}
      </span>
      {badge != null ? (
        <span
          className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${
            badgeVariant === 'danger'
              ? 'bg-red-500 text-white group-hover:bg-red-400'
              : 'bg-[#F5F5F5] text-[#111111] group-hover:bg-[#EEEEEE]'
          }`}
        >
          {badge}
        </span>
      ) : null}
    </NavLink>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="mb-2 mt-6 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666666] first:mt-0">
      {children}
    </p>
  )
}

function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  )
}

function initialsFromName(name) {
  if (!name?.trim()) return 'OI'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/**
 * Navigation latérale admin (design system Nestymo).
 */
export default function Sidebar() {
  const { user, role } = useUser()
  const isAdmin = role === 'admin'
  const [annoncesPublieesCount, setAnnoncesPublieesCount] = useState(null)

  const displayName = user?.user_metadata?.full_name?.trim() || 'Olivier'
  const avatarLetters = initialsFromName(displayName)

  async function handleLogout() {
    await deconnexion()
  }

  useEffect(() => {
    let cancelled = false
    async function loadPending() {
      const { count } = await supabase
        .from('annonces')
        .select('id', { count: 'exact', head: true })
        .eq('statut', 'en_attente_validation')
      if (!cancelled) setAnnoncesPublieesCount(count ?? 0)
    }
    loadPending()
    const channel = supabase
      .channel('admin-annonces-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'annonces' }, () => {
        loadPending()
      })
      .subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <aside
      className="flex w-[260px] shrink-0 flex-col border-r border-[#E5E5E5] bg-[#FFFFFF] text-[#111111]"
      style={{ fontFamily: '"DM Sans", sans-serif' }}
    >
      <div className="flex items-center gap-3 p-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E02020] shadow-sm transition-transform duration-200 hover:scale-[1.02]">
          <IconHome className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <span className="block text-lg font-semibold leading-tight text-[#111111]" style={FONT_PLAYFAIR}>
            Nestymo
          </span>
          <span className="mt-0.5 block text-[11px] font-medium tracking-wide text-[#E02020]/70">
            {isAdmin ? 'Espace Admin' : 'Espace Agence'}
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col items-stretch overflow-y-auto px-2 pb-4" aria-label="Navigation principale">
        <SectionLabel>Principal</SectionLabel>
        <NavItem to="/admin/dashboard" end icon={LayoutDashboard}>
          <span>Tableau de bord</span>
        </NavItem>
        <NavItem to="/admin/annonces" badge={isAdmin ? annoncesPublieesCount : undefined} icon={Building2}>
          <span>Annonces</span>
        </NavItem>
        {isAdmin ? (
          <NavItem to="/admin/agences" icon={Briefcase}>
            <span>Agences</span>
          </NavItem>
        ) : null}
        {isAdmin ? (
          <NavItem to="/admin/leads" icon={Users}>
            <span>Leads</span>
          </NavItem>
        ) : null}

        {isAdmin ? <SectionLabel>Analyse</SectionLabel> : null}
        {isAdmin ? (
          <NavItem to="/admin/statistiques" icon={BarChart3}>
            <span>Statistiques</span>
          </NavItem>
        ) : null}
        {isAdmin ? (
          <NavItem
            to="/admin/agent-ia"
            icon={Sparkles}
            disabled
            badge="A venir"
            tooltip="Fonctionnalite en cours de developpement"
          >
            <span>Agent IA</span>
          </NavItem>
        ) : null}

        <SectionLabel>Système</SectionLabel>
        <NavItem
          to="/admin/contenu"
          icon={FileText}
          disabled
          badge="A venir"
          tooltip="Fonctionnalite en cours de developpement"
        >
          <span>Contenu</span>
        </NavItem>
        <NavItem
          to="/admin/moderation"
          icon={ShieldCheck}
          disabled
          badge="A venir"
          tooltip="Fonctionnalite en cours de developpement"
        >
          <span>Moderation</span>
        </NavItem>
        <NavItem to="/admin/parametres" icon={Settings}>
          <span>Paramètres</span>
        </NavItem>
      </nav>

      <div className="mt-auto border-t border-[#E5E5E5] p-4">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E02020] text-sm font-semibold text-white shadow-sm transition hover:ring-2 hover:ring-[#E02020]/40"
            aria-hidden
          >
            {avatarLetters}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#111111]">{displayName}</p>
            <p className="truncate text-xs text-[#666666]">{isAdmin ? 'Administrateur' : 'Agent immobilier'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full cursor-pointer rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm font-medium text-[#111111] transition-colors duration-200 hover:border-[#E02020] hover:text-[#E02020]"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
