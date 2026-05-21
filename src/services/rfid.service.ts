import apiClient from './api';
import type { RfidEvent, RfidEventFilters, PaginatedResponse, PaginationParams } from '@/types';

/**
 * Service RFID - Gestion des accès et overrides admin
 *
 * LOGIQUE D'ACCÈS :
 * - Carte admin → accès universel toutes salles
 * - Carte étudiant → vérifie identité + heure + date + matière/salle
 * - Admin peut forcer l'accès (override) pour étudiants en retard
 */
export const rfidService = {
  getEvents: async (params: PaginationParams & RfidEventFilters): Promise<PaginatedResponse<RfidEvent>> => {
    const r = await apiClient.get<PaginatedResponse<RfidEvent>>('/rfid/events', { params });
    return r.data;
  },

  getEventById: async (id: string): Promise<RfidEvent> => {
    const r = await apiClient.get<RfidEvent>(`/rfid/events/${id}`);
    return r.data;
  },

  overrideStatus: async (eventId: string, status: string, reason: string): Promise<RfidEvent> => {
    const r = await apiClient.patch<RfidEvent>(`/rfid/events/${eventId}/override`, { status, reason });
    return r.data;
  },

  /**
   * ADMIN OVERRIDE : Forcer l'accès pour un étudiant en retard
   *
   * L'admin est le seul qui peut permettre à un étudiant
   * d'intégrer la salle malgré un retard excessif.
   */
  adminOverride: async (
    universityId: number,
    data: {
      studentId: number;
      classroomId: number;
      timetableEntryId: number;
      reason: string;
    }
  ): Promise<{
    status: string;
    message: string;
    override: {
      adminName: string;
      reason: string;
      studentName: string;
      course: string;
      classroom: string;
    };
    attendanceId: number;
    accessLogId: string;
  }> => {
    const r = await apiClient.post(`/universities/${universityId}/rfid/admin-override`, {
      student_id: data.studentId,
      classroom_id: data.classroomId,
      timetable_entry_id: data.timetableEntryId,
      reason: data.reason,
    });
    return r.data;
  },

  /**
   * Obtenir les logs d'accès RFID avec filtres avancés
   */
  getLogs: async (
    universityId: number,
    params?: {
      status?: 'granted' | 'refused';
      accessType?: 'normal' | 'admin_scan' | 'admin_override';
      dateFrom?: string;
      dateTo?: string;
      classroomId?: number;
      studentId?: number;
      limit?: number;
      offset?: number;
    }
  ) => {
    const r = await apiClient.get(`/universities/${universityId}/rfid/logs`, { params });
    return r.data;
  },

  exportCsv: async (params: RfidEventFilters): Promise<Blob> => {
    const r = await apiClient.get('/rfid/events/export', { params, responseType: 'blob' });
    return r.data;
  },

  /**
   * Attribuer (ou remplacer) une carte RFID à un étudiant
   * POST /universities/{universityId}/rfid/assign
   */
  assignToStudent: async (
    universityId: number,
    studentId: number,
    cardNumber: string
  ): Promise<{
    message: string;
    card: {
      id: string;
      card_number: string;
      is_active: boolean;
      assigned_at: string;
      student: { id: number; name: string; registration_number: string };
    };
  }> => {
    const r = await apiClient.post(`/universities/${universityId}/rfid/assign`, {
      student_id: studentId,
      card_number: cardNumber,
    });
    return r.data;
  },

  /**
   * Activer / désactiver une carte RFID
   * PATCH /universities/{universityId}/rfid/{cardId}/toggle
   */
  toggleCard: async (
    universityId: number,
    cardId: string,
    reason?: string
  ): Promise<{ message: string; card: { id: string; card_number: string; is_active: boolean } }> => {
    const r = await apiClient.patch(`/universities/${universityId}/rfid/${cardId}/toggle`, { reason });
    return r.data;
  },

  /**
   * Supprimer définitivement une carte RFID
   * DELETE /universities/{universityId}/rfid/{cardId}
   */
  deleteCard: async (universityId: number, cardId: string): Promise<{ message: string }> => {
    const r = await apiClient.delete(`/universities/${universityId}/rfid/${cardId}`);
    return r.data;
  },
};
