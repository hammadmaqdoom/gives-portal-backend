import { Student } from '../../domain/student';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { FilterStudentDto, SortStudentDto } from '../../dto/query-student.dto';

export abstract class StudentRepository {
  abstract create(data: Partial<Student>): Promise<Student>;

  abstract findById(id: Student['id']): Promise<NullableType<Student>>;

  abstract findByUserId(userId: number): Promise<NullableType<Student>>;
  abstract findByEmail(email: string): Promise<NullableType<Student>>;

  abstract findByStudentId(
    studentId: Student['studentId'],
  ): Promise<NullableType<Student>>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    includeRelations,
  }: {
    filterOptions?: FilterStudentDto | null;
    sortOptions?: SortStudentDto[] | null;
    paginationOptions: IPaginationOptions;
    includeRelations?: boolean;
  }): Promise<Student[]>;

  abstract update(
    id: Student['id'],
    data: Partial<Student>,
  ): Promise<Student | null>;

  abstract remove(id: Student['id']): Promise<void>;

  abstract generateStudentId(): Promise<string>;
}
