import apiClient from './api';
import type { KpiData, PunctualityOverTime, StudentRanking, CourseStats, StatFilters } from '@/types';

export const statsService = {
  getKpis: async (): Promise<KpiData> => {
    const r = await apiClient.get<KpiData>('/stats/kpis');
    return r.data;
  },
  getPunctualityOverTime: async (filters: StatFilters): Promise<PunctualityOverTime[]> => {
    const r = await apiClient.get<PunctualityOverTime[]>('/stats/punctuality-over-time', { params: filters });
    return r.data;
  },
  getStudentRankings: async (filters: StatFilters): Promise<StudentRanking[]> => {
    const r = await apiClient.get<StudentRanking[]>('/stats/student-rankings', { params: filters });
    return r.data;
  },
  getCourseStats: async (filters: StatFilters): Promise<CourseStats[]> => {
    const r = await apiClient.get<CourseStats[]>('/stats/by-course', { params: filters });
    return r.data;
  },
};
