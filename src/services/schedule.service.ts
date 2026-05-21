import apiClient from './api';

export interface ScheduleEntry {
  id: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  courseType: 'CM' | 'TD' | 'TP' | 'Projet' | 'lecture';
  teacherId: number | null;
  teacherName: string | null;
  roomId: number;
  roomName: string;
  dayOfWeek: string;   // 'Monday' | 'Tuesday' | ...
  startTime: string;   // 'HH:mm:ss'
  endTime: string;     // 'HH:mm:ss'
  recurrencePattern: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CreateScheduleDto {
  course_id: number;
  classroom_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  session_type?: string;
  recurrence_pattern?: string;
  start_date: string;
  end_date?: string | null;
  filiere_ids?: number[];
}

const BASE = (universityId: number) => `/universities/${universityId}/schedule`;

export const scheduleService = {
  getAll: async (
    universityId: number,
    filters?: { filiere_id?: number | string; day?: string },
  ): Promise<ScheduleEntry[]> => {
    const r = await apiClient.get<{ data: ScheduleEntry[] }>(BASE(universityId), { params: filters });
    return r.data.data ?? [];
  },

  create: async (universityId: number, dto: CreateScheduleDto): Promise<ScheduleEntry> => {
    const r = await apiClient.post<{ entry: ScheduleEntry }>(BASE(universityId), dto);
    return r.data.entry;
  },

  update: async (universityId: number, id: number, dto: Partial<CreateScheduleDto>): Promise<ScheduleEntry> => {
    const r = await apiClient.put<{ entry: ScheduleEntry }>(`${BASE(universityId)}/${id}`, dto);
    return r.data.entry;
  },

  delete: async (universityId: number, id: number): Promise<void> => {
    await apiClient.delete(`${BASE(universityId)}/${id}`);
  },
};
