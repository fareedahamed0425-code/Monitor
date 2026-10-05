import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkstationsPage from './pages/WorkstationsPage';
import WorkstationDetailPage from './pages/WorkstationDetailPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import SessionsPage from './pages/SessionsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ScreenshotsPage from './pages/ScreenshotsPage';
import AlertsPage from './pages/AlertsPage';
import PoliciesPage from './pages/PoliciesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import EvidenceVaultPage from './pages/EvidenceVaultPage';

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
    <div className="loading-spinner" />
  </Box>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <CssBaseline />
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workstations" element={<WorkstationsPage />} />
          <Route path="/workstations/:id" element={<WorkstationDetailPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/screenshots" element={<ScreenshotsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/evidence-vault" element={<EvidenceVaultPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;