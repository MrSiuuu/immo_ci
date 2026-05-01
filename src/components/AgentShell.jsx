import { useUser } from '../hooks/useUser'
import AgentSidebar from './AgentSidebar.jsx'
import AgentTopBar from './AgentTopBar.jsx'
import AgentStatusBanner from './AgentStatusBanner.jsx'

/**
 * Coquille layout — routes /agence/* (sidebar + topbar + bandeau statut).
 */
export default function AgentShell({ title, children }) {
  const { agence } = useUser()

  return (
    <div className="flex h-screen bg-[#FAF6EF] dark:bg-slate-950">
      <AgentSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AgentTopBar title={title} />
        <AgentStatusBanner verification_status={agence?.verification_status} statut={agence?.statut} />
        <main className="flex-1 overflow-y-auto bg-[#FAF6EF] p-6 dark:bg-slate-950">{children}</main>
      </div>
    </div>
  )
}
