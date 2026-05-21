export interface Teacher {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  departmentId: string;
  grade?: string;
  specialization: string;
  status: 'active' | 'inactive';
  courseCount: number;
  office?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherDto {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  grade?: string;
  specialization: string;
  office?: string;
}

export interface UpdateTeacherDto extends Partial<CreateTeacherDto> {
  status?: 'active' | 'inactive';
}
