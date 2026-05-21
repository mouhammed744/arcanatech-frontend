import apiClient from './api';
import type { Student, CreateStudentDto, UpdateStudentDto } from '@/types';

export interface StudentListParams {
  search?: string;
  level?: string;
  limit?: number;
  offset?: number;
}

export interface StudentListResponse {
  data: Student[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export const studentService = {
  getAll: async (universityId: number, params?: StudentListParams): Promise<StudentListResponse> => {
    const r = await apiClient.get<StudentListResponse>(
      `/universities/${universityId}/students`,
      { params }
    );
    return r.data;
  },

  getById: async (universityId: number, id: number | string): Promise<Student> => {
    const r = await apiClient.get<Student>(`/universities/${universityId}/students/${id}`);
    return r.data;
  },

  create: async (universityId: number, dto: CreateStudentDto): Promise<{ message: string; student: Student }> => {
    const r = await apiClient.post<{ message: string; student: Student }>(
      `/universities/${universityId}/students`,
      dto
    );
    return r.data;
  },

  update: async (
    universityId: number,
    id: number | string,
    dto: UpdateStudentDto
  ): Promise<{ message: string; student: Student }> => {
    const r = await apiClient.put<{ message: string; student: Student }>(
      `/universities/${universityId}/students/${id}`,
      dto
    );
    return r.data;
  },

  delete: async (universityId: number, id: number | string): Promise<void> => {
    await apiClient.delete(`/universities/${universityId}/students/${id}`);
  },

  getAttendanceHistory: async (
    universityId: number,
    studentId: number | string,
    params?: { startDate?: string; endDate?: string }
  ) => {
    const r = await apiClient.get(
      `/universities/${universityId}/students/${studentId}/attendances`,
      { params }
    );
    return r.data;
  },
};
