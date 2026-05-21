export type CourseType = 'lecture' | 'lab' | 'tutorial' | 'project';

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  programId: string;
  programName: string;
  semesterId: string;
  credits?: number;
  lateMarginMinutes: number;
  totalHours?: number;
  type: CourseType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  code: string;
  name: string;
  description?: string;
  teacherId: string;
  programId: string;
  semesterId: string;
  credits?: number;
  lateMarginMinutes: number;
  totalHours?: number;
  type: CourseType;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {
  isActive?: boolean;
}
