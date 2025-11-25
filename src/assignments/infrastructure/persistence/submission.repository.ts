import { Submission } from '../../domain/submission';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';

export abstract class SubmissionRepository {
  abstract create(data: Partial<Submission>): Promise<Submission>;

  abstract findById(id: Submission['id']): Promise<NullableType<Submission>>;

  abstract findByAssignment(assignmentId: number): Promise<Submission[]>;

  abstract findByStudent(studentId: number): Promise<Submission[]>;

  abstract findByStudentAndAssignment(
    studentId: number,
    assignmentId: number,
  ): Promise<NullableType<Submission>>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: any | null;
    sortOptions?: any[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Submission[]>;

  abstract update(
    id: Submission['id'],
    data: Partial<Submission>,
  ): Promise<Submission | null>;

  abstract remove(id: Submission['id']): Promise<void>;
}
