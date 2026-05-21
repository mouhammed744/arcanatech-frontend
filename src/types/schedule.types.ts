export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type SessionStatus = 'scheduled' | 'cancelled' | 'postponed' | 'completed';
export type RecurrenceType = 'once' | 'weekly' | 'biweekly' | 'custom';

export interface ScheduleSession {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  roomName: string;
  groupId?: string;
  groupName?: string;
  date: string;
  startTime: string;
  endTime: string;
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;
  status: SessionStatus;
  cancellationReason?: string;
  notes?: string;
  conflictsWith?: string[];
}

export interface CreateSessionDto {
  courseId: string;
  roomId: string;
  groupId?: string;
  date: string;
  startTime: string;
  endTime: string;
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;
  notes?: string;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflicts: Array<{
    type: 'room' | 'teacher' | 'student_group';
    existingSessionId: string;
    description: string;
  }>;
}

export interface WeekSchedule {
  weekStart: string;
  weekEnd: string;
  sessions: ScheduleSession[];
}
