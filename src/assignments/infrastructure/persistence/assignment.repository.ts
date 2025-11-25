import { Assignment } from '../../domain/assignment';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import {
  FilterAssignmentDto,
  SortAssignmentDto,
} from '../../dto/query-assignment.dto';

export abstract class AssignmentRepository {
  abstract create(data: Partial<Assignment>): Promise<Assignment>;

  abstract findById(id: Assignment['id']): Promise<NullableType<Assignment>>;

  abstract findByClass(classId: number): Promise<Assignment[]>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterAssignmentDto | null;
    sortOptions?: SortAssignmentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Assignment[]>;

  abstract update(
    id: Assignment['id'],
    data: Partial<Assignment>,
  ): Promise<Assignment | null>;

  abstract remove(id: Assignment['id']): Promise<void>;
}
