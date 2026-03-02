/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ReportsPage } from './pages/ReportsPage';
import { AuthorizedPersonsPage } from './pages/AuthorizedPersonsPage';
import { KeyReportsPage } from './pages/KeyReportsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

type Page = 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports' | 'admin-users';

function AppRoutes() {
  const { isAuthenticated, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (currentPage === 'admin-users') {
    return <AdminUsersPage onNavigate={setCurrentPage} onLogout={logout} />;
  }

  if (currentPage === 'key-reports') {
    return <KeyReportsPage onNavigate={setCurrentPage} onLogout={logout} />;
  }

  if (currentPage === 'authorized-persons') {
    return <AuthorizedPersonsPage onNavigate={setCurrentPage} onLogout={logout} />;
  }

  if (currentPage === 'reports') {
    return <ReportsPage onNavigate={setCurrentPage} onLogout={logout} />;
  }

  return <Dashboard onNavigate={setCurrentPage} onLogout={logout} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
