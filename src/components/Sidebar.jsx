import { NavLink } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { deconnexion } from '../features/auth/authService'

const FONT_PLAYFAIR = { fontFamily: '"Playfair Display", serif' }

const linkShell =
  'group flex cursor-pointer items-center gap-3 rounded-r-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200'

const linkActive =
  `${linkShell} ml-2 max-w-max self-start border-[#D97B00] bg-[#D97B00]/10 text-[#D97B00]`

const linkInactive =
  `${linkShell} mx-2 w-[calc(100%-1rem)] border-transparent text-white/45 hover:bg-white/5 hover:text-white/80`

function NavItem({ to, end, children, badge, badgeVariant = 'neutral' }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? linkActive : linkInactive)}>
      <span className="flex min-w-0 items-center gap-3">{children}</span>
      {badge != null ? (
        <span
          className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${
            badgeVariant === 'danger'
              ? 'bg-red-500 text-white group-hover:bg-red-400'
              : 'bg-white/10 text-white/90 group-hover:bg-white/15'
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
    <p className="mb-2 mt-6 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 first:mt-0">
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

function IconList(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01" strokeLinecap="round" />
    </svg>
  )
}

function IconBuilding(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M4 21V8l8-4 8 4v13" strokeLinejoin="round" />
      <path d="M9 21v-5h6v5" strokeLinejoin="round" />
      <path d="M9 10h.01M12 10h.01M15 10h.01" strokeLinecap="round" />
    </svg>
  )
}

function IconChart(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M4 19V5" strokeLinecap="round" />
      <path d="M4 19h16" strokeLinecap="round" />
      <path d="M8 16V11M12 16V8M16 16v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M4 6h16v12H4V6Z" strokeLinejoin="round" />
      <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
    </svg>
  )
}

function IconCog(props) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <circle cx="12" cy="12" r="3" strokeLinejoin="round" />
      <path
        d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        strokeLinecap="round"
      />
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
 * Navigation latérale admin (design system ImmoCI).
 */
export default function Sidebar() {
  const { user } = useUser()

  const displayName = user?.user_metadata?.full_name?.trim() || 'Olivier'
  const avatarLetters = initialsFromName(displayName)

  async function handleLogout() {
    await deconnexion()
  }

  return (
    <aside
      className="flex w-[260px] shrink-0 flex-col border-r border-white/5 bg-[#1A1A2E] text-white dark:border-white/10"
      style={{ fontFamily: '"DM Sans", sans-serif' }}
    >
      <div className="flex items-center gap-3 p-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D97B00] shadow-sm transition-transform duration-200 hover:scale-[1.02]">
          <IconHome className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <span className="block text-lg font-semibold leading-tight text-white" style={FONT_PLAYFAIR}>
            ImmoCI
          </span>
          <span className="mt-0.5 block text-[11px] font-medium tracking-wide text-[#D97B00]/55">
            Espace Admin
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col items-stretch overflow-y-auto px-2 pb-4" aria-label="Navigation principale">
        <SectionLabel>Principal</SectionLabel>
        <NavItem to="/admin/dashboard" end>
          <IconHome />
          <span>Tableau de bord</span>
        </NavItem>
        <NavItem to="/admin/annonces" badge={348}>
          <IconList />
          <span>Annonces</span>
        </NavItem>
        <NavItem to="/admin/agences">
          <IconBuilding />
          <span>Agences</span>
        </NavItem>

        <SectionLabel>Analyse</SectionLabel>
        <NavItem to="/admin/statistiques">
          <IconChart />
          <span>Statistiques</span>
        </NavItem>
        <NavItem to="/admin/contacts" badge={5} badgeVariant="danger">
          <IconMail />
          <span>Contacts</span>
        </NavItem>

        <SectionLabel>Système</SectionLabel>
        <NavItem to="/admin/parametres">
          <IconCog />
          <span>Paramètres</span>
        </NavItem>
      </nav>

      <div className="mt-auto border-t border-white/10 p-4 dark:border-white/5">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D97B00] text-sm font-semibold text-white shadow-sm transition hover:ring-2 hover:ring-[#D97B00]/40"
            aria-hidden
          >
            {avatarLetters}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-white/50">Administrateur</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full cursor-pointer rounded-lg border border-white/25 bg-transparent px-3 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/10"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
