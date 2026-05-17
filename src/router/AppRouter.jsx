import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import LoginPage from '../features/auth/LoginPage.jsx'
import AuthFlowGuard from '../components/AuthFlowGuard.jsx'
import RequireAdmin from '../components/RequireAdmin.jsx'
import RequireAgent from '../components/RequireAgent.jsx'
import AdminOnlyRoute from '../components/AdminOnlyRoute.jsx'
import AgentOnlyRoute from '../components/AgentOnlyRoute.jsx'
import Sidebar from '../components/Sidebar.jsx'
import TopBar from '../components/TopBar.jsx'
import AgentShell from '../components/AgentShell.jsx'
import AgentStatusBanner from '../components/AgentStatusBanner.jsx'
import AnnonceTypeSelectionPage from '../features/annonces/AnnonceTypeSelectionPage.jsx'
import DashboardPage from '../pages/admin/DashboardPage.jsx'
import AnnoncesPage from '../pages/admin/AnnoncesPage.jsx'
import AnnonceEditPage from '../pages/admin/AnnonceEditPage.jsx'
import ParametresPage from '../pages/admin/ParametresPage.jsx'
import AgencesListPage from '../features/agences/AgencesListPage.jsx'
import AgenceFormPage from '../features/agences/AgenceFormPage.jsx'
import AgenceDetailPage from '../features/agences/AgenceDetailPage.jsx'
import ChangePasswordPage from '../features/auth/ChangePasswordPage.jsx'
import OnboardingPage from '../features/auth/OnboardingPage.jsx'
import AgentDashboardPage from '../pages/agent/AgentDashboardPage.jsx'
import AgentAnnoncesPage from '../pages/agent/AgentAnnoncesPage.jsx'
import AgentParametresPage from '../pages/agent/AgentParametresPage.jsx'
import AgentStatistiquesPage from '../pages/agent/AgentStatistiquesPage.jsx'
import AgentPlaceholderPage from '../pages/agent/AgentPlaceholderPage.jsx'
import AgentLeadsPage from '../pages/agent/AgentLeadsPage.jsx'
import AgentProfilPage from '../pages/agent/AgentProfilPage.jsx'
import AgentAbonnementPage from '../pages/agent/AgentAbonnementPage.jsx'
import AgentOwnerOnlyRoute from '../components/AgentOwnerOnlyRoute.jsx'
import AnnonceDetailPage from '../pages/admin/AnnonceDetailPage.jsx'
import StatistiquesPage from '../pages/admin/StatistiquesPage.jsx'
import StatAnnoncesPage from '../pages/admin/StatAnnoncesPage.jsx'
import StatAgencesPage from '../pages/admin/StatAgencesPage.jsx'
import StatEngagementPage from '../pages/admin/StatEngagementPage.jsx'
import StatPrixPage from '../pages/admin/StatPrixPage.jsx'
import StatClassementsPage from '../pages/admin/StatClassementsPage.jsx'
import StatTendancesPage from '../pages/admin/StatTendancesPage.jsx'
import LeadsPage from '../pages/admin/LeadsPage.jsx'
import LeadDetailPage from '../pages/admin/LeadDetailPage.jsx'
import AgentLeadDetailPage from '../pages/agent/AgentLeadDetailPage.jsx'
import AppartementForm from '../features/annonces/forms/AppartementForm.jsx'
import VillaForm from '../features/annonces/forms/VillaForm.jsx'
import DuplexForm from '../features/annonces/forms/DuplexForm.jsx'
import StudioForm from '../features/annonces/forms/StudioForm.jsx'
import ChambreForm from '../features/annonces/forms/ChambreForm.jsx'
import ImmeubleForm from '../features/annonces/forms/ImmeubleForm.jsx'
import LocalCommercialForm from '../features/annonces/forms/LocalCommercialForm.jsx'
import TerrainForm from '../features/annonces/forms/TerrainForm.jsx'
import { useUser } from '../hooks/useUser.js'

/**
 * Coquille admin : sidebar + topbar + zone scrollable.
 */
function AdminShell({ title, children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto bg-[#F5F7FA] p-6">{children}</main>
      </div>
    </div>
  )
}

/**
 * Formulaire annonce plein écran - annulation vers la liste selon le préfixe de route.
 */
function FormShell({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, agence } = useUser()
  const isAgence = location.pathname.startsWith('/agence')
  const annoncesList = isAgence || role === 'agent' ? '/agence/annonces' : '/admin/annonces'

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF]">
      <header className="flex shrink-0 flex-col border-b border-[#E5E5E5] bg-[#FFFFFF]">
        {isAgence ? (
          <AgentStatusBanner verification_status={agence?.verification_status} statut={agence?.statut} />
        ) : null}
        <div className="flex items-center justify-between px-6 py-4">
          <span
            className="text-xl font-semibold text-[#E02020]"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Nestymo
          </span>
          <button
            type="button"
            onClick={() => navigate(annoncesList)}
            className="rounded-full border border-[#E02020] px-4 py-2 text-sm font-medium text-[#E02020] transition hover:bg-[#E02020]/10"
          >
            Annuler
          </button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</div>
    </div>
  )
}

/**
 * Routes principales : espaces /admin (admin) et /agence (agent) séparés.
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/change-password"
        element={
          <AuthFlowGuard>
            <ChangePasswordPage />
          </AuthFlowGuard>
        }
      />

      <Route
        path="/agence/onboarding"
        element={
          <AuthFlowGuard>
            <RequireAgent>
              <AgentShell title="Bienvenue">
                <OnboardingPage />
              </AgentShell>
            </RequireAgent>
          </AuthFlowGuard>
        }
      />

      <Route
        path="/agence/dashboard"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentShell title="Tableau de bord">
                <AgentDashboardPage />
              </AgentShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/annonces"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentShell title="Mes annonces">
                <AgentAnnoncesPage />
              </AgentShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/annonces/new"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <FormShell>
                <AnnonceTypeSelectionPage />
              </FormShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route path="/agence/annonces/new/appartement" element={<AuthFlowGuard><AgentOnlyRoute><FormShell><AppartementForm /></FormShell></AgentOnlyRoute></AuthFlowGuard>} />
      <Route path="/agence/annonces/new/villa" element={<AuthFlowGuard><AgentOnlyRoute><FormShell><VillaForm /></FormShell></AgentOnlyRoute></AuthFlowGuard>} />
      <Route path="/agence/annonces/new/duplex" element={<AuthFlowGuard><AgentOnlyRoute><FormShell><DuplexForm /></FormShell></AgentOnlyRoute></AuthFlowGuard>} />
      <Route path="/agence/annonces/new/studio" element={<AuthFlowGuard><AgentOnlyRoute><FormShell><StudioForm /></FormShell></AgentOnlyRoute></AuthFlowGuard>} />
      <Route path="/agence/annonces/new/chambre" element={<AuthFlowGuard><AgentOnlyRoute><FormShell><ChambreForm /></FormShell></AgentOnlyRoute></AuthFlowGuard>} />
      <Route path="/agence/annonces/new/immeuble" element={<AuthFlowGuard><AgentOnlyRoute><FormShell><ImmeubleForm /></FormShell></AgentOnlyRoute></AuthFlowGuard>} />
      <Route path="/agence/annonces/new/local-commercial" element={<AuthFlowGuard><AgentOnlyRoute><FormShell><LocalCommercialForm /></FormShell></AgentOnlyRoute></AuthFlowGuard>} />
      <Route path="/agence/annonces/new/terrain" element={<AuthFlowGuard><AgentOnlyRoute><FormShell><TerrainForm /></FormShell></AgentOnlyRoute></AuthFlowGuard>} />
      <Route
        path="/agence/annonces/:id"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentShell title="Detail annonce">
                <AnnonceDetailPage />
              </AgentShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/annonces/:id/edit"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <FormShell>
                <AnnonceEditPage />
              </FormShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/contacts"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentShell title="Leads">
                <AgentLeadsPage />
              </AgentShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/contacts/:id"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentShell title="Détail du contact">
                <AgentLeadDetailPage />
              </AgentShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/profil"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentOwnerOnlyRoute>
                <AgentShell title="Profil agence">
                  <AgentProfilPage />
                </AgentShell>
              </AgentOwnerOnlyRoute>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/abonnement"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentOwnerOnlyRoute>
                <AgentShell title="Abonnement">
                  <AgentAbonnementPage />
                </AgentShell>
              </AgentOwnerOnlyRoute>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/messagerie"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentShell title="Messagerie">
                <AgentPlaceholderPage title="Messagerie" />
              </AgentShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/statistiques"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentShell title="Statistiques">
                <AgentStatistiquesPage />
              </AgentShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/agent-ia"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentShell title="Agent IA">
                <AgentPlaceholderPage title="Agent IA" />
              </AgentShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/agence/parametres"
        element={
          <AuthFlowGuard>
            <AgentOnlyRoute>
              <AgentShell title="Paramètres">
                <AgentParametresPage />
              </AgentShell>
            </AgentOnlyRoute>
          </AuthFlowGuard>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <AdminShell title="Tableau de bord">
                <DashboardPage />
              </AdminShell>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/admin/annonces"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <AdminShell title="Mes annonces">
                <AnnoncesPage />
              </AdminShell>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/admin/annonces/new"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <FormShell>
                <AnnonceTypeSelectionPage />
              </FormShell>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route path="/admin/annonces/new/appartement" element={<AuthFlowGuard><AdminOnlyRoute><FormShell><AppartementForm /></FormShell></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/annonces/new/villa" element={<AuthFlowGuard><AdminOnlyRoute><FormShell><VillaForm /></FormShell></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/annonces/new/duplex" element={<AuthFlowGuard><AdminOnlyRoute><FormShell><DuplexForm /></FormShell></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/annonces/new/studio" element={<AuthFlowGuard><AdminOnlyRoute><FormShell><StudioForm /></FormShell></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/annonces/new/chambre" element={<AuthFlowGuard><AdminOnlyRoute><FormShell><ChambreForm /></FormShell></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/annonces/new/immeuble" element={<AuthFlowGuard><AdminOnlyRoute><FormShell><ImmeubleForm /></FormShell></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/annonces/new/local-commercial" element={<AuthFlowGuard><AdminOnlyRoute><FormShell><LocalCommercialForm /></FormShell></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/annonces/new/terrain" element={<AuthFlowGuard><AdminOnlyRoute><FormShell><TerrainForm /></FormShell></AdminOnlyRoute></AuthFlowGuard>} />
      <Route
        path="/admin/annonces/:id"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <FormShell>
                <AnnonceDetailPage />
              </FormShell>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/admin/annonces/:id/edit"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <FormShell>
                <AnnonceEditPage />
              </FormShell>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />

      <Route
        path="/admin/agences"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <RequireAdmin>
                <AdminShell title="Gestion des agences">
                  <AgencesListPage />
                </AdminShell>
              </RequireAdmin>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/admin/agences/new"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <RequireAdmin>
                <AdminShell title="Nouvelle agence">
                  <AgenceFormPage />
                </AdminShell>
              </RequireAdmin>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/admin/agences/:id/edit"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <RequireAdmin>
                <AdminShell title="Modifier l’agence">
                  <AgenceFormPage />
                </AdminShell>
              </RequireAdmin>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/admin/agences/:id"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <RequireAdmin>
                <AdminShell title="Détail agence">
                  <AgenceDetailPage />
                </AdminShell>
              </RequireAdmin>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />

      <Route
        path="/admin/statistiques"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <RequireAdmin>
                <AdminShell title="Statistiques">
                  <StatistiquesPage />
                </AdminShell>
              </RequireAdmin>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route path="/admin/statistiques/annonces" element={<AuthFlowGuard><AdminOnlyRoute><RequireAdmin><AdminShell title="Stats annonces"><StatAnnoncesPage /></AdminShell></RequireAdmin></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/statistiques/agences" element={<AuthFlowGuard><AdminOnlyRoute><RequireAdmin><AdminShell title="Stats agences"><StatAgencesPage /></AdminShell></RequireAdmin></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/statistiques/engagement" element={<AuthFlowGuard><AdminOnlyRoute><RequireAdmin><AdminShell title="Stats engagement"><StatEngagementPage /></AdminShell></RequireAdmin></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/statistiques/prix" element={<AuthFlowGuard><AdminOnlyRoute><RequireAdmin><AdminShell title="Stats prix"><StatPrixPage /></AdminShell></RequireAdmin></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/statistiques/classements" element={<AuthFlowGuard><AdminOnlyRoute><RequireAdmin><AdminShell title="Classements"><StatClassementsPage /></AdminShell></RequireAdmin></AdminOnlyRoute></AuthFlowGuard>} />
      <Route path="/admin/statistiques/tendances" element={<AuthFlowGuard><AdminOnlyRoute><RequireAdmin><AdminShell title="Tendances"><StatTendancesPage /></AdminShell></RequireAdmin></AdminOnlyRoute></AuthFlowGuard>} />
      <Route
        path="/admin/leads"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <RequireAdmin>
                <AdminShell title="Leads">
                  <LeadsPage />
                </AdminShell>
              </RequireAdmin>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route
        path="/admin/leads/:id"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <RequireAdmin>
                <AdminShell title="Détail du lead">
                  <LeadDetailPage />
                </AdminShell>
              </RequireAdmin>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />
      <Route path="/admin/contacts" element={<Navigate to="/admin/leads" replace />} />
      <Route
        path="/admin/parametres"
        element={
          <AuthFlowGuard>
            <AdminOnlyRoute>
              <AdminShell title="Paramètres">
                <ParametresPage />
              </AdminShell>
            </AdminOnlyRoute>
          </AuthFlowGuard>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
