import apiClient from './api';
import type { Course, CreateCourseDto, UpdateCourseDto, PaginatedResponse, PaginationParams } from '@/types';

export const courseService = {
  getAll: async (params: PaginationParams): Promise<PaginatedResponse<Course>> => {
    const response = await apiClient.get<PaginatedResponse<Course>>('/courses', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Course> => {
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  },

  create: async (dto: CreateCourseDto): Promise<Course> => {
    const response = await apiClient.post<Course>('/courses', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateCourseDto): Promise<Course> => {
    const response = await apiClient.patch<Course>(`/courses/${id}`, dto);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}`);
  },
};
