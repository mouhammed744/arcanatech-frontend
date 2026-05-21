import apiClient from './api';

// ═══════════════════════════════════════════════════════
// Service Codes Temporaires - Gestion des codes d'accès temporaires
//
// Permet aux admins de :
// - Lister tous les codes temporaires (actifs ou tous)
// - Generer un code pour un etudiant sans carte RFID
// - Revoquer un code actif
// - Rechercher des etudiants pour l'autocomplete
// ═══════════════════════════════════════════════════════

export interface TemporaryCode {
  id: string;
  code: string;
  student: { id: number; name: string; registrationNumber: string };
  classroom: string | null;
  reason: string;
  expiresAt: string;
  isExpired: boolean;
  isUsed: boolean;
  usedAt: string | null;
  generatedBy: string;
  createdAt: string;
}

export interface GenerateCodePayload {
  student_id: number;
  classroom_id?: number;
  timetable_entry_id?: number;
  reason?: string;
  duration_minutes?: number;
}

export interface StudentSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  studentNumber: string;
  email?: string;
}

export const temporaryCodeService = {
  /**
   * Lister les codes temporaires
   */
  list: async (universityId: number, activeOnly = false) => {
    const params: Record<string, string> = { limit: '50' };
    if (activeOnly) params.active_only = 'true';
    const r = await apiClient.get(`/universities/${universityId}/temporary-codes`, { params });
    return r.data;
  },

  /**
   * Generer un nouveau code temporaire pour un etudiant
   */
  generate: async (universityId: number, payload: GenerateCodePayload) => {
    const r = await apiClient.post(`/universities/${universityId}/temporary-codes`, payload);
    return r.data;
  },

  /**
   * Revoquer un code temporaire actif
   */
  revoke: async (universityId: number, codeId: string) => {
    const r = await apiClient.delete(`/universities/${universityId}/temporary-codes/${codeId}`);
    return r.data;
  },

  /**
   * Rechercher des etudiants pour l'autocomplete
   */
  searchStudents: async (universityId: number, search: string) => {
    const r = await apiClient.get(`/universities/${universityId}/students`, {
      params: { search, limit: 10 },
    });
    return r.data;
  },

  /**
   * Lister les salles disponibles
   */
  listRooms: async (universityId: number) => {
    const r = await apiClient.get(`/universities/${universityId}/rooms`, {
      params: { limit: 100 },
    });
    return r.data;
  },
};
