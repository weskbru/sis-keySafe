import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setLogoutHandler } from '../services/api';
import { authService, type LoginCredentials, type CurrentUser } from '../services/authService';

interface AuthContextValue {
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    authService.isAuthenticated()
  );
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (isAuthenticated && !currentUser) {
      authService.me().then(setCurrentUser).catch(() => logout());
    }
  }, [isAuthenticated, currentUser, logout]);

  async function login(credentials: LoginCredentials): Promise<void> {
    await authService.login(credentials);
    setIsAuthenticated(true);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
