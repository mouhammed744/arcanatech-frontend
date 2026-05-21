import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { setTokens, logout } from '@/store/slices/authSlice';
import { isTokenExpired } from '@/lib/security';
import type { AuthTokens } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Prévention : indique au serveur que c'est une requête AJAX (pas un formulaire)
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// ═══════════════════════════════════════════════════════
// REQUEST INTERCEPTOR - Injection token + vérification expiration
// ═══════════════════════════════════════════════════════
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.accessToken;

    if (token) {
      // Vérifier l'expiration avant d'envoyer la requête
      // Si le token est sur le point d'expirer (< 30s), on ne l'envoie pas
      // pour déclencher le refresh via le 401
      if (!isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Sécurité : empêcher les requêtes vers des domaines non autorisés
    if (config.baseURL && config.url && !config.url.startsWith('/') && !config.url.startsWith(BASE_URL)) {
      return Promise.reject(new Error('Requête vers un domaine non autorisé bloquée.'));
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR - Refresh automatique + gestion erreurs
// ═══════════════════════════════════════════════════════
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ── 401 : Token expiré → tenter un refresh ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = store.getState().auth.refreshToken;

      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<{ tokens: AuthTokens }>(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
          }
        );

        const { tokens } = response.data;
        store.dispatch(setTokens(tokens));
        processQueue(null, tokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 429 : Rate limited ──
    if (error.response?.status === 429) {
      console.warn('Rate limited. Réessayez plus tard.');
    }

    // ── 403 : Accès refusé ──
    if (error.response?.status === 403) {
      console.warn('Accès refusé à cette ressource.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
