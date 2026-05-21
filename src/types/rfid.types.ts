export type RfidEventType = 'entry' | 'exit' | 'unknown' | 'duplicate' | 'qr' | 'nfc';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused' | 'refused';

export interface RfidEvent {
  id: string;
  rfidUid?: string;
  studentId?: string;
  studentName?: string;
  studentNumber?: string;
  sessionId?: string;
  courseName?: string;
  courseCode?: string;
  roomId: string;
  roomName: string;
  readerId: string;
  eventType: RfidEventType;
  attendanceStatus: AttendanceStatus;
  scannedAt: string;
  minutesLate: number;
  isManuallyOverridden: boolean;
  overrideReason?: string;
  overriddenBy?: string;
  refusalReason?: string;
  timestamp?: string;
  cardId?: string;
  accessType?: string;
  notes?: string;
  student?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    studentNumber?: string;
  };
  room?: {
    id?: string;
    name?: string;
  };
  course?: {
    id?: string;
    name?: string;
    code?: string;
  };
  reader?: {
    id?: string;
    ipAddress?: string;
  };
}

export interface LiveRfidEvent extends RfidEvent {
  isNew?: boolean;
}

export interface RfidEventFilters {
  startDate?: string;
  endDate?: string;
  roomId?: string;
  courseId?: string;
  studentId?: string;
  attendanceStatus?: AttendanceStatus;
  eventType?: RfidEventType;
}

export interface ReaderStatusUpdate {
  readerId: string;
  status: 'online' | 'offline' | 'error';
  roomName: string;
  timestamp: string;
}
