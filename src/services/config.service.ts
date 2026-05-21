import apiClient from './api';
import type { AppConfig } from '@/types';

export const configService = {
  getConfig: async (): Promise<AppConfig> => {
    const r = await apiClient.get<AppConfig>('/config');
    return r.data;
  },
  updateConfig: async (config: Partial<AppConfig>): Promise<AppConfig> => {
    const r = await apiClient.patch<AppConfig>('/config', config);
    return r.data;
  },
};
