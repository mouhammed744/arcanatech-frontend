import type { UniversityConfig } from './university.types';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'superadmin' | 'scolarite';
  avatar?: string;
  universityId?: number;
  university?: UniversityConfig;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'totp' | 'email' | 'both' | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

/**
 * Reponse de login quand la 2FA est activee sur le compte.
 */
export interface TwoFactorChallengeResponse {
  requires2fa: true;
  method: 'totp' | 'email' | 'both';
  challengeToken: string;
  maskedEmail: string;
  message: string;
}

export type LoginApiResponse = LoginResponse | TwoFactorChallengeResponse;

export const isTwoFactorChallenge = (r: LoginApiResponse): r is TwoFactorChallengeResponse =>
  'requires2fa' in r && r.requires2fa === true;

export interface TwoFactorStatus {
  enabled: boolean;
  method: 'totp' | 'email' | 'both' | null;
  confirmedAt: string | null;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  manualEntry: string;
  message: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
