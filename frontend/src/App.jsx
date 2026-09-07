import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrestationsPage from './pages/PrestationsPage';
import MesCommandesPage from './pages/MesCommandesPage';
import InterventionsPage from './pages/InterventionsPage';
import PaymentPage from './pages/PaymentPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCommandesPage from './pages/admin/AdminCommandesPage';
import AdminPrestatairesPage from './pages/admin/AdminPrestatairesPage';
import AdminFacturesPage from './pages/admin/AdminFacturesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import VipPage from './pages/VipPage';
import VipPaymentPage from './pages/VipPaymentPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import MonProfilPage from './pages/MonProfilPage';
import MesFacturesPage from './pages/MesFacturesPage';
import NotificationsPage from './pages/NotificationsPage';
import ConversationsPage from './pages/ConversationsPage';
import ConversationPage from './pages/ConversationPage';

// Composant ProtectedRoute
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="container loading">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Composant AdminRoute
function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/prestations" element={<PrestationsPage />} />
        <Route path="/vip" element={<VipPage />} />

        {/* Route paiement VIP */}
        <Route
          path="/payment-vip"
          element={
            <ProtectedRoute>
              <VipPaymentPage />
            </ProtectedRoute>
          }
        />

        {/* Routes utilisateur connecté */}
        <Route
          path="/mes-commandes"
          element={
            <ProtectedRoute>
              <MesCommandesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interventions"
          element={
            <ProtectedRoute>
              <InterventionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <MonProfilPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mes-factures"
          element={
            <ProtectedRoute>
              <MesFacturesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <ConversationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:commandeId"
          element={
            <ProtectedRoute>
              <ConversationPage />
            </ProtectedRoute>
          }
        />

        {/* Routes admin */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/commandes"
          element={
            <AdminRoute>
              <AdminCommandesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/prestataires"
          element={
            <AdminRoute>
              <AdminPrestatairesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/factures"
          element={
            <AdminRoute>
              <AdminFacturesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />

        {/* Route par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
