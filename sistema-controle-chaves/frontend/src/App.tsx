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
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

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
