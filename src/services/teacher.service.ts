import apiClient from './api';
import type { Teacher, PaginatedResponse, PaginationParams } from '@/types';

const BASE = (universityId: number) => `/universities/${universityId}/teachers`;

export const teacherService = {
  getAll: async (universityId: number, params?: PaginationParams): Promise<PaginatedResponse<Teacher>> => {
    const response = await apiClient.get<PaginatedResponse<Teacher>>(BASE(universityId), { params });
    return response.data;
  },

  getById: async (universityId: number, id: string): Promise<Teacher> => {
    const response = await apiClient.get<{ teacher: Teacher } | Teacher>(`${BASE(universityId)}/${id}`);
    return (response.data as any).teacher ?? response.data as Teacher;
  },

  create: async (universityId: number, dto: { firstName: string; lastName: string; email: string; phone?: string; specialty?: string }): Promise<Teacher> => {
    const response = await apiClient.post<{ teacher: Teacher }>(`${BASE(universityId)}`, dto);
    return response.data.teacher;
  },

  update: async (universityId: number, id: string, dto: Partial<{ firstName: string; lastName: string; email: string; phone: string; specialty: string }>): Promise<Teacher> => {
    const response = await apiClient.put<{ teacher: Teacher }>(`${BASE(universityId)}/${id}`, dto);
    return response.data.teacher;
  },

  delete: async (universityId: number, id: string): Promise<void> => {
    await apiClient.delete(`${BASE(universityId)}/${id}`);
  },
};
