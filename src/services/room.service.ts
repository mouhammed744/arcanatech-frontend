import apiClient from './api';
import type { Room, CreateRoomDto, UpdateRoomDto, PaginatedResponse, PaginationParams } from '@/types';

export const roomService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Room>> => {
    const r = await apiClient.get<PaginatedResponse<Room>>('/rooms', { params });
    return r.data;
  },
  getById: async (id: string): Promise<Room> => {
    const r = await apiClient.get<Room>(`/rooms/${id}`);
    return r.data;
  },
  create: async (dto: CreateRoomDto): Promise<Room> => {
    const r = await apiClient.post<Room>('/rooms', dto);
    return r.data;
  },
  update: async (id: string, dto: UpdateRoomDto): Promise<Room> => {
    const r = await apiClient.patch<Room>(`/rooms/${id}`, dto);
    return r.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },
};
