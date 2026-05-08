import { createElement } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, Building2, LayoutDashboard, LogOut, MessageSquare, Settings, Sparkles, Users } from 'lucide-react'
import { useUser } from '../hooks/useUser'
import { deconnexion } from '../features/auth/authService'

const FONT_INTER = { fontFamily: '"Inter", sans-serif' }

const linkShell =
  'group flex cursor-pointer items-center gap-3 rounded-r-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors duration-200'

const linkActive =
  `${linkShell} ml-2 max-w-max self-start border-[#E02020] bg-[#E02020] text-white`

const linkInactive =
  `${linkShell} mx-2 w-[calc(100%-1rem)] border-transparent text-[#111111]/70 hover:bg-[#F8F8F8] hover:text-[#111111]`

function NavItem({ to, end, icon, children, tourId, disabled = false, badge = null }) {
  if (disabled) {
    return (
      <div
        data-tour={tourId}
        className={`${linkInactive} cursor-not-allowed opacity-50`}
        title="Fonctionnalite en cours de developpement"
        role="link"
        aria-disabled="true"
      >
        <span className="flex min-w-0 items-center gap-3">
          {createElement(icon, {
            className: 'h-5 w-5 shrink-0',
            strokeWidth: 1.75,
            'aria-hidden': true,
          })}
          {children}
        </span>
        {badge ? (
          <span className="ml-auto shrink-0 rounded-full bg-[#E02020] px-2 py-0.5 text-[8px] font-semibold uppercase text-white">
            {badge}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <NavLink
      to={to}
      end={end}
      data-tour={tourId}
      className={({ isActive }) => (isActive ? linkActive : linkInactive)}
    >
      <span className="flex min-w-0 items-center gap-3">
        {createElement(icon, {
          className: 'h-5 w-5 shrink-0',
          strokeWidth: 1.75,
          'aria-hidden': true,
        })}
        {children}
      </span>
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

/**
 * Navigation latérale - espace agent uniquement (/agence/*).
 */
export default function AgentSidebar() {
  const { user, agence } = useUser()
  const agenceNom = agence?.nom?.trim() || 'Mon agence'

  async function handleLogout() {
    await deconnexion()
  }

  return (
    <aside
      data-tour="agent-sidebar"
      className="flex w-[260px] shrink-0 flex-col border-r border-[#E5E5E5] bg-[#FFFFFF] text-[#111111]"
      style={FONT_INTER}
    >
      <div className="flex items-center gap-3 p-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E02020] shadow-sm">
          <LayoutDashboard className="h-5 w-5 text-white" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0">
          <span className="block text-lg font-semibold leading-tight text-[#111111]" style={FONT_INTER}>
            Nestymo
          </span>
          <span className="mt-0.5 block text-[11px] font-medium tracking-wide text-[#E02020]/70">Espace Agence</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col items-stretch overflow-y-auto px-2 pb-4" aria-label="Navigation agent">
        <SectionLabel>Principal</SectionLabel>
        <NavItem to="/agence/dashboard" end icon={LayoutDashboard}>
          <span>Tableau de bord</span>
        </NavItem>
        <NavItem to="/agence/annonces" icon={Building2} tourId="agent-nav-annonces">
          <span>Mes annonces</span>
        </NavItem>
        <SectionLabel>Services</SectionLabel>
        <NavItem to="/agence/contacts" icon={Users} disabled badge="A venir">
          <span>Contacts</span>
        </NavItem>
        <NavItem to="/agence/messagerie" icon={MessageSquare} disabled badge="A venir">
          <span>Messagerie</span>
        </NavItem>
        <NavItem to="/agence/statistiques" icon={BarChart3}>
          <span>Statistiques</span>
        </NavItem>
        <NavItem to="/agence/agent-ia" icon={Sparkles} disabled badge="A venir">
          <span>Agent IA</span>
        </NavItem>
        <SectionLabel>Système</SectionLabel>
        <NavItem to="/agence/parametres" icon={Settings} tourId="agent-nav-settings">
          <span>Paramètres</span>
        </NavItem>
      </nav>

      <div className="mt-auto border-t border-[#E5E5E5] p-4">
        <div className="mb-4 min-w-0">
          <p className="truncate text-sm font-semibold text-[#111111]">{agenceNom}</p>
          <p className="truncate text-xs text-[#666666]">Agent immobilier</p>
          {user?.email ? <p className="mt-1 truncate text-[11px] text-[#888888]">{user.email}</p> : null}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm font-medium text-[#111111] transition-colors duration-200 hover:border-[#E02020] hover:text-[#E02020]"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
