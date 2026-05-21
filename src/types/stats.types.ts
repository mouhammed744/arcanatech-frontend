export interface KpiData {
  totalStudents: number;
  totalScansToday: number;
  punctualityRateToday: number;
  lateCountToday: number;
  absentCountToday: number;
  presentCountToday: number;
  activeReadersCount: number;
  totalReadersCount: number;
  alertsCount: number;
  comparedToYesterday: { scans: number; punctuality: number; late: number };
}

export interface PunctualityOverTime {
  date: string;
  punctualityRate: number;
  lateCount: number;
  absentCount: number;
  presentCount: number;
}

export interface StudentRanking {
  rank: number;
  studentId: string;
  studentName: string;
  studentNumber: string;
  programName: string;
  punctualityRate: number;
  lateCount: number;
  absentCount: number;
}

export interface CourseStats {
  courseId: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  averagePunctuality: number;
  totalSessions: number;
  totalAttendances: number;
  latePercentage: number;
  absentPercentage: number;
  presentPercentage: number;
}

export interface StatFilters {
  startDate?: string;
  endDate?: string;
  programId?: string;
  courseId?: string;
  teacherId?: string;
  groupId?: string;
}

export interface AppConfig {
  // Attendance settings
  globalLateMarginMinutes: number;
  alertThresholdCount: number;
  alertThresholdDays: number;
  adminEmail: string;
  timezone: string;
  // Features
  enableQrCode: boolean;
  enableNfc: boolean;
  // Security
  twoFactorEnabled: boolean;
  twoFactorMethod: 'totp' | 'email' | 'both';
  // Appearance
  accentColor: 'indigo' | 'blue' | 'sky' | 'emerald' | 'amber';
  uiDensity: 'compact' | 'normal' | 'comfortable';
  darkMode: boolean;
}
