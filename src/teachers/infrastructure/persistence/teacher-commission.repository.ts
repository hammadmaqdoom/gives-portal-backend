import { TeacherCommission } from '../../domain/teacher-commission';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import {
  FilterTeacherCommissionDto,
  SortTeacherCommissionDto,
} from '../../dto/query-teacher-commission.dto';

export abstract class TeacherCommissionRepository {
  abstract create(data: Partial<TeacherCommission>): Promise<TeacherCommission>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTeacherCommissionDto | null;
    sortOptions?: SortTeacherCommissionDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TeacherCommission[]>;

  abstract findById(
    id: TeacherCommission['id'],
  ): Promise<NullableType<TeacherCommission>>;

  abstract findByTeacher(teacherId: number): Promise<TeacherCommission[]>;

  abstract findByClass(classId: number): Promise<TeacherCommission[]>;

  abstract findByStudent(studentId: number): Promise<TeacherCommission[]>;

  abstract findPendingCommissions(): Promise<TeacherCommission[]>;

  abstract findOverdueCommissions(): Promise<TeacherCommission[]>;

  abstract update(
    id: TeacherCommission['id'],
    data: Partial<TeacherCommission>,
  ): Promise<TeacherCommission | null>;

  abstract markAsPaid(
    id: TeacherCommission['id'],
    transactionId?: string,
  ): Promise<TeacherCommission | null>;

  abstract remove(id: TeacherCommission['id']): Promise<void>;
}
