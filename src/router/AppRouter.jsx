import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import LoginPage from '../features/auth/LoginPage.jsx'
import PrivateRoute from '../components/PrivateRoute.jsx'
import Sidebar from '../components/Sidebar.jsx'
import TopBar from '../components/TopBar.jsx'
import AnnonceForm from '../features/annonces/AnnonceForm/index.jsx'
import DashboardPage from '../pages/admin/DashboardPage.jsx'
import AnnoncesPage from '../pages/admin/AnnoncesPage.jsx'
import AnnonceEditPage from '../pages/admin/AnnonceEditPage.jsx'
import ParametresPage from '../pages/admin/ParametresPage.jsx'

/**
 * Coquille admin : sidebar + topbar + zone scrollable (CDC mission 1).
 */
function AdminShell({ title, children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto bg-[#FAF6EF] p-6 dark:bg-slate-950">{children}</main>
      </div>
    </div>
  )
}

/**
 * Formulaire annonce plein écran — sans sidebar ni topbar.
 */
function FormShell({ children }) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF6EF] dark:bg-slate-950">
      <header className="flex shrink-0 items-center justify-between border-b border-[#E8E3D8] bg-[#FAF6EF] px-6 py-4 dark:border-slate-700 dark:bg-slate-950">
        <span
          className="text-xl font-semibold text-[#D97B00]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          ImmoCI
        </span>
        <button
          type="button"
          onClick={() => navigate('/admin/annonces')}
          className="rounded-lg border border-[#D97B00] px-4 py-2 text-sm font-medium text-[#D97B00] transition hover:bg-[#D97B00]/10 dark:hover:bg-[#D97B00]/20"
        >
          Annuler
        </button>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8 dark:bg-slate-950">{children}</div>
    </div>
  )
}

/**
 * Routes principales : login public, espace /admin protégé.
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute>
            <AdminShell title="Tableau de bord">
              <DashboardPage />
            </AdminShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/annonces"
        element={
          <PrivateRoute>
            <AdminShell title="Mes annonces">
              <AnnoncesPage />
            </AdminShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/annonces/new"
        element={
          <PrivateRoute>
            <FormShell>
              <AnnonceForm />
            </FormShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/annonces/:id/edit"
        element={
          <PrivateRoute>
            <FormShell>
              <AnnonceEditPage />
            </FormShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/agences"
        element={
          <PrivateRoute>
            <AdminShell title="Agences">
              <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-gray-800 dark:text-white">Agences (à venir)</div>
            </AdminShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/statistiques"
        element={
          <PrivateRoute>
            <AdminShell title="Statistiques">
              <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-gray-800 dark:text-white">Statistiques (à venir)</div>
            </AdminShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/contacts"
        element={
          <PrivateRoute>
            <AdminShell title="Contacts">
              <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-gray-800 dark:text-white">Contacts (à venir)</div>
            </AdminShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/parametres"
        element={
          <PrivateRoute>
            <AdminShell title="Paramètres">
              <ParametresPage />
            </AdminShell>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
