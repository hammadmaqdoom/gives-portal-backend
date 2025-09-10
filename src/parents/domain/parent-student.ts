import { Parent } from './parent';
import { Student } from '../../students/domain/student';

export class ParentStudent {
  id: number;

  parentId: number;

  studentId: number;

  status: 'active' | 'inactive';

  parent?: Parent;

  student?: Student;

  createdAt: Date;

  updatedAt: Date;

  deletedAt?: Date;
}
