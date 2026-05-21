import apiClient from './api';
import type { StatFilters } from '@/types';

export type ReportType = 'individual' | 'class' | 'global';
export type ReportFormat = 'pdf' | 'csv';

export interface GenerateReportParams extends StatFilters {
  type: ReportType;
  format: ReportFormat;
  targetId?: string;
}

export const reportsService = {
  generate: async (params: GenerateReportParams): Promise<Blob> => {
    const response = await apiClient.post('/reports/generate', params, { responseType: 'blob' });
    return response.data;
  },

  getHistory: async () => {
    const response = await apiClient.get('/reports/history');
    return response.data;
  },
};
