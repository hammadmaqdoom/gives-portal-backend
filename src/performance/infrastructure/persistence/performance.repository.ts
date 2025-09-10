import { Performance } from '../../domain/performance';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import {
  FilterPerformanceDto,
  SortPerformanceDto,
} from '../../dto/query-performance.dto';

export abstract class PerformanceRepository {
  abstract create(data: Partial<Performance>): Promise<Performance>;

  abstract findById(id: Performance['id']): Promise<NullableType<Performance>>;

  abstract findByStudentAndAssignment(
    studentId: number,
    assignmentId: number,
  ): Promise<NullableType<Performance>>;

  abstract findByStudent(studentId: number): Promise<Performance[]>;

  abstract findByAssignment(assignmentId: number): Promise<Performance[]>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterPerformanceDto | null;
    sortOptions?: SortPerformanceDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Performance[]>;

  abstract update(
    id: Performance['id'],
    data: Partial<Performance>,
  ): Promise<Performance | null>;

  abstract remove(id: Performance['id']): Promise<void>;
}
