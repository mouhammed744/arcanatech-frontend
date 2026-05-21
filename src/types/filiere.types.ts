/**
 * Types pour les Filières et la mise à jour en masse
 *
 * RÈGLES MÉTIER :
 * - Une filière regroupe des étudiants d'un même programme
 * - L'admin peut cibler une/plusieurs filières pour mise à jour en masse
 * - Les informations d'emploi du temps (heure, date, salle) peuvent être
 *   mises à jour instantanément pour tous les étudiants d'une filière
 * - Les informations personnelles NE PEUVENT PAS être modifiées en masse
 */

export interface Filiere {
  id: number;
  code: string;
  name: string;
  description: string | null;
  level: string;
  department: string | null;
  isActive: boolean;
  studentsCount: number;
}

export interface FiliereDetail extends Filiere {
  students: FiliereStudent[];
  timetable: FiliereTimetableEntry[];
}

export interface FiliereStudent {
  id: number;
  registrationNumber: string;
  name: string;
  email: string;
  level: string;
  hasRfid: boolean;
  rfidActive: boolean;
}

export interface FiliereTimetableEntry {
  id: number;
  courseCode: string;
  courseName: string;
  classroom: string | null;
  building: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  sessionType: string;
}

export interface CreateFiliereDto {
  code: string;
  name: string;
  description?: string;
  level: string;
  department?: string;
}

export interface UpdateFiliereDto {
  code?: string;
  name?: string;
  description?: string;
  level?: string;
  department?: string;
  isActive?: boolean;
}

/**
 * Mise à jour en masse de l'emploi du temps
 *
 * AUTORISÉ en masse :
 * ✅ classroom_id (salle)
 * ✅ start_time / end_time (heure)
 * ✅ day_of_week (jour)
 * ✅ start_date / end_date (date)
 *
 * INTERDIT en masse :
 * ❌ Informations personnelles des étudiants
 */
export interface BulkScheduleUpdateDto {
  filiereIds: number[];
  courseId: number;
  updates: {
    classroomId?: number;
    startTime?: string;
    endTime?: string;
    dayOfWeek?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface BulkScheduleUpdateResponse {
  status: 'success';
  message: string;
  details: {
    filieres: Array<{ id: number; name: string }>;
    affectedEntries: number;
    affectedStudents: number;
    updatesApplied: Record<string, string | number>;
  };
}

export interface BulkCardUpdateDto {
  filiereIds: number[];
  action: 'activate' | 'deactivate';
  reason?: string;
}

export interface BulkCardUpdateResponse {
  status: 'success';
  message: string;
  affectedCards: number;
}
