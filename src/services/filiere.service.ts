import api from './api';
import type {
  Filiere,
  FiliereDetail,
  CreateFiliereDto,
  UpdateFiliereDto,
  BulkScheduleUpdateDto,
  BulkScheduleUpdateResponse,
  BulkCardUpdateDto,
  BulkCardUpdateResponse,
} from '@/types/filiere.types';

const BASE = (uniId: number) => `/universities/${uniId}/filieres`;

/**
 * Service Filières
 *
 * CRUD + Mise à jour en masse
 * L'admin peut :
 * - Gérer les filières (CRUD)
 * - Mettre à jour l'emploi du temps en masse par filière(s)
 * - Activer/désactiver les cartes RFID en masse par filière(s)
 */
const filiereService = {
  /**
   * Lister toutes les filières avec le nombre d'étudiants
   */
  getAll(
    universityId: number,
    params?: {
      level?: string;
      department?: string;
      activeOnly?: boolean;
      search?: string;
    }
  ): Promise<{ data: Filiere[]; total: number }> {
    return api.get(BASE(universityId), { params }).then((r) => r.data);
  },

  /**
   * Détails d'une filière avec étudiants et emploi du temps
   */
  getById(universityId: number, id: number): Promise<FiliereDetail> {
    return api.get(`${BASE(universityId)}/${id}`).then((r) => ({
      ...r.data.filiere,
      students: r.data.students,
      timetable: r.data.timetable,
    }));
  },

  /**
   * Créer une filière
   */
  create(universityId: number, data: CreateFiliereDto): Promise<Filiere> {
    return api.post(BASE(universityId), data).then((r) => r.data.filiere);
  },

  /**
   * Modifier une filière
   */
  update(universityId: number, id: number, data: UpdateFiliereDto): Promise<Filiere> {
    return api.put(`${BASE(universityId)}/${id}`, data).then((r) => r.data.filiere);
  },

  /**
   * Supprimer une filière (soft delete)
   */
  delete(universityId: number, id: number): Promise<void> {
    return api.delete(`${BASE(universityId)}/${id}`);
  },

  /**
   * MISE À JOUR EN MASSE DE L'EMPLOI DU TEMPS
   *
   * Met à jour instantanément les informations de planning
   * pour tous les étudiants de filière(s) ciblée(s).
   *
   * ✅ Autorisé : salle, heure, jour, date
   * ❌ Interdit : informations personnelles
   */
  bulkUpdateSchedule(
    universityId: number,
    data: BulkScheduleUpdateDto
  ): Promise<BulkScheduleUpdateResponse> {
    return api
      .post(`${BASE(universityId)}/bulk-update-schedule`, {
        filiere_ids: data.filiereIds,
        course_id: data.courseId,
        updates: {
          ...(data.updates.classroomId && { classroom_id: data.updates.classroomId }),
          ...(data.updates.startTime && { start_time: data.updates.startTime }),
          ...(data.updates.endTime && { end_time: data.updates.endTime }),
          ...(data.updates.dayOfWeek && { day_of_week: data.updates.dayOfWeek }),
          ...(data.updates.startDate && { start_date: data.updates.startDate }),
          ...(data.updates.endDate && { end_date: data.updates.endDate }),
        },
      })
      .then((r) => r.data);
  },

  /**
   * Activer/désactiver en masse les cartes RFID d'une filière
   */
  bulkUpdateCards(
    universityId: number,
    data: BulkCardUpdateDto
  ): Promise<BulkCardUpdateResponse> {
    return api
      .post(`${BASE(universityId)}/bulk-update-cards`, {
        filiere_ids: data.filiereIds,
        action: data.action,
        reason: data.reason,
      })
      .then((r) => r.data);
  },
};

export default filiereService;
