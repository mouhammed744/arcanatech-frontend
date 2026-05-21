export type StudentLevel = 'L1' | 'L2' | 'L3' | 'M1' | 'M2' | 'D1' | 'D2' | 'D3';

export interface RfidCard {
  id: number;
  card_number: string;
  is_active: boolean;
  issued_at?: string;
  last_scanned_at?: string;
  total_scans?: number;
  successful_scans?: number;
  failed_scans?: number;
}

export type StudentGender = 'M' | 'F';

export interface Student {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  phone?: string;
  gender?: StudentGender | null;
  registration_number: string;
  level: StudentLevel;
  filiere_id?: number;
  rfid_card?: RfidCard | null;
  enrollment_count?: number;
}

export interface CreateStudentDto {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  gender?: StudentGender | null;
  registration_number: string;
  level: StudentLevel;
  filiere_id?: number | null;
}

export interface UpdateStudentDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  gender?: StudentGender | null;
  registration_number?: string;
  level?: StudentLevel;
  filiere_id?: number | null;
}

export interface AssignRfidDto {
  studentId: number;
  rfidUid: string;
  expiresAt?: string;
}
