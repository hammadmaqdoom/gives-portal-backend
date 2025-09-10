import { User } from '../../users/domain/user';
import { Student } from '../../students/domain/student';

export class Parent {
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

  passcode?: string | null;

  user?: User | null;

  students?: Array<{
    id: number;
    name: string;
    studentId: string;
    status: 'active' | 'inactive';
  }>;

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;
}
