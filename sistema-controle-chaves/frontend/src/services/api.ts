import axios, { type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

// Registrado pelo AuthContext para que o interceptor possa acionar o logout
let _logoutHandler: (() => void) | null = null;

export function setLogoutHandler(fn: () => void) {
  _logoutHandler = fn;
}

// ── Request: anexa o access token em toda requisição ─────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: trata 401 com refresh automático ────────────────────────────────
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!)
  );
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryConfig;

    // Propaga qualquer erro que não seja 401, ou que já tentou refresh
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      _logoutHandler?.();
      return Promise.reject(error);
    }

    // Se já há um refresh em andamento, enfileira e aguarda
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{ access: string }>(
        `${BASE_URL}/api/token/refresh/`,
        { refresh: refreshToken }
      );
      localStorage.setItem('access_token', data.access);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
      processQueue(null, data.access);
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      _logoutHandler?.();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
