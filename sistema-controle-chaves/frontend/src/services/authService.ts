import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

const KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
} as const;

export const authService = {
  async login(credentials: LoginCredentials): Promise<void> {
    const { data } = await api.post<{ access: string; refresh: string }>(
      '/api/token/',
      credentials
    );
    localStorage.setItem(KEYS.access, data.access);
    localStorage.setItem(KEYS.refresh, data.refresh);
  },

  logout(): void {
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(KEYS.access);
  },
};
