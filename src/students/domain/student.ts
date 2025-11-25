import { FileType } from '../../files/domain/file';
import { User } from '../../users/domain/user';
import { Parent } from '../../parents/domain/parent';

export class Student {
  id: number;

  studentId: string;

  name: string;

  address?: string | null;

  city?: string | null;

  country?: string | null;

  dateOfBirth?: Date | null;

  email?: string | null;

  contact?: string | null;

  userId?: number | null;

  photo?: FileType | null;

  user?: User | null;

  classes?: Array<{
    id: number;
    name: string;
    batchTerm: string;
    weekdays: string[];
    timing: string;
    timezone?: string;
    courseOutline?: string | null;
    enrollmentDate: Date;
    enrollmentStatus: string;
  }>;

  parents?: Array<{
    id: number;
    fullName: string;
    mobile?: string | null;
    landline?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    email?: string | null;
    relationship?: 'father' | 'mother' | 'guardian' | null;
    maritalStatus?: 'married' | 'divorced' | 'deceased' | 'single' | null;
    status: 'active' | 'inactive';
  }>;

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;
}
