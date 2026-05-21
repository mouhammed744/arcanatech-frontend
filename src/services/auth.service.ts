import apiClient from './api';
import type { LoginCredentials, LoginApiResponse, LoginResponse, User } from '@/types';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginApiResponse> => {
    const response = await apiClient.post<LoginApiResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Inscription d'un nouvel utilisateur
   * Validation renforcée côté backend :
   * - Email unique
   * - Mot de passe fort (8+ chars, majuscule, minuscule, chiffre, spécial)
   * - Code université valide
   */
  register: async (data: RegisterData): Promise<{ message: string; user: User }> => {
    const response = await apiClient.post('/auth/register', {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      password_confirmation: data.password,
      university_code: 'LCS',
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', {
      token,
      password:              newPassword,
      password_confirmation: newPassword,
    });
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword,
    });
  },

  uploadAvatar: async (file: File): Promise<{ avatar: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post<{ message: string; avatar: string }>('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await apiClient.delete('/auth/avatar');
  },

  /**
   * PATCH /auth/select-university
   * Permet à un nouvel utilisateur OAuth de choisir son université (appel unique).
   */
  selectUniversity: async (universityId: number): Promise<User> => {
    const response = await apiClient.patch<{ user: User }>('/auth/select-university', {
      university_id: universityId,
    });
    return response.data.user;
  },

  // ═══ OAuth Social Login ═══
  getOAuthRedirectUrl: (provider: 'google' | 'facebook' | 'instagram'): string => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    return `${apiUrl}/auth/${provider}/redirect`;
  },

  handleOAuthCallback: async (provider: string, params: Record<string, string>): Promise<LoginApiResponse> => {
    const response = await apiClient.get<LoginResponse>(`/auth/${provider}/callback`, { params });
    return response.data;
  },
};
