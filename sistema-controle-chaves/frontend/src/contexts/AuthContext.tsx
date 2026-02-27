import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setLogoutHandler } from '../services/api';
import { authService, type LoginCredentials } from '../services/authService';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Inicializa a partir do localStorage para persistir sessão entre recargas
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    authService.isAuthenticated()
  );

  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
  }, []);

  // Registra o logout no interceptor axios para tratar token expirado (401)
  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  async function login(credentials: LoginCredentials): Promise<void> {
    await authService.login(credentials);
    setIsAuthenticated(true);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
