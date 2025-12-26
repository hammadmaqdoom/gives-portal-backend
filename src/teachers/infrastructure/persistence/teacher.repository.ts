import { Teacher } from '../../domain/teacher';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { FilterTeacherDto, SortTeacherDto } from '../../dto/query-teacher.dto';

export abstract class TeacherRepository {
  abstract create(data: Partial<Teacher>): Promise<Teacher>;

  abstract findById(id: Teacher['id']): Promise<NullableType<Teacher>>;

  abstract findByEmail(email: Teacher['email']): Promise<NullableType<Teacher>>;

  abstract findByPhone(phone: Teacher['phone']): Promise<NullableType<Teacher>>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTeacherDto | null;
    sortOptions?: SortTeacherDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Teacher[]>;

  abstract update(
    id: Teacher['id'],
    data: Partial<Teacher>,
  ): Promise<Teacher | null>;

  abstract remove(id: Teacher['id']): Promise<void>;

  abstract findPublicTeachers(): Promise<Teacher[]>;
}
