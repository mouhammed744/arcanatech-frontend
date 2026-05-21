import apiClient from './api';
import type {
  LoginApiResponse,
  TwoFactorSetupResponse,
  TwoFactorStatus,
} from '@/types';

export const twoFactorService = {
  status: async (): Promise<TwoFactorStatus> => {
    const r = await apiClient.get<TwoFactorStatus>('/auth/2fa/status');
    return r.data;
  },

  /** Demarre la configuration TOTP : genere un secret et retourne un QR code. */
  setup: async (): Promise<TwoFactorSetupResponse> => {
    const r = await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup');
    return r.data;
  },

  /** Confirme l'activation TOTP avec un code du telephone. */
  confirm: async (code: string, method: 'totp' | 'both' = 'totp') => {
    const r = await apiClient.post<{ enabled: true; method: string; message: string }>(
      '/auth/2fa/confirm',
      { code, method },
    );
    return r.data;
  },

  /** Active la 2FA par email uniquement (sans scanner de QR). */
  enableEmail: async () => {
    const r = await apiClient.post<{ enabled: true; method: 'email'; message: string }>(
      '/auth/2fa/enable-email',
    );
    return r.data;
  },

  /** Envoie un code OTP par email pendant le challenge de login. */
  sendCode: async (challengeToken: string) => {
    const r = await apiClient.post<{ sent: true; message: string }>('/auth/2fa/send-code', {
      challengeToken,
    });
    return r.data;
  },

  /** Verifie un code 2FA (challenge post-login) — retourne la reponse de login finale. */
  verify: async (challengeToken: string, code: string, method?: 'totp' | 'email'): Promise<LoginApiResponse> => {
    const r = await apiClient.post<LoginApiResponse>('/auth/2fa/verify', {
      challengeToken,
      code,
      method,
    });
    return r.data;
  },

  /** Desactive la 2FA apres confirmation du mot de passe. */
  disable: async (password: string) => {
    const r = await apiClient.delete<{ enabled: false; message: string }>('/auth/2fa', {
      data: { password },
    });
    return r.data;
  },
};
