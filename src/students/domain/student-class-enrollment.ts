import { Class } from '../../classes/domain/class';
import { Student } from './student';

export class StudentClassEnrollment {
  id: number;

  studentId: number;

  classId: number;

  enrollmentDate: Date;

  deenrollmentDate?: Date;

  status: 'active' | 'inactive' | 'completed' | 'dropped';

  adminGrantedAccess?: boolean;

  customFeePKR?: number | null;

  customFeeUSD?: number | null;

  student?: Student;

  class?: Class;

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;
}
