/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ReportsPage } from './pages/ReportsPage';
import { AuthorizedPersonsPage } from './pages/AuthorizedPersonsPage';
import { KeyReportsPage } from './pages/KeyReportsPage';

type Page = 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  if (currentPage === 'key-reports') {
    return (
      <KeyReportsPage 
        onNavigate={setCurrentPage} 
        onLogout={() => setIsLoggedIn(false)} 
      />
    );
  }

  if (currentPage === 'authorized-persons') {
    return (
      <AuthorizedPersonsPage 
        onNavigate={setCurrentPage} 
        onLogout={() => setIsLoggedIn(false)} 
      />
    );
  }

  if (currentPage === 'reports') {
    return (
      <ReportsPage 
        onNavigate={setCurrentPage} 
        onLogout={() => setIsLoggedIn(false)} 
      />
    );
  }

  return (
    <Dashboard 
      onNavigate={setCurrentPage}
      onLogout={() => setIsLoggedIn(false)} 
    />
  );
}
