import { Subject } from '../../domain/subject';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { FilterSubjectDto, SortSubjectDto } from '../../dto/query-subject.dto';

export abstract class SubjectRepository {
  abstract create(data: Partial<Subject>): Promise<Subject>;

  abstract findById(id: Subject['id']): Promise<NullableType<Subject>>;

  abstract findByName(name: Subject['name']): Promise<NullableType<Subject>>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterSubjectDto | null;
    sortOptions?: SortSubjectDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Subject[]>;

  abstract update(
    id: Subject['id'],
    data: Partial<Subject>,
  ): Promise<Subject | null>;

  abstract remove(id: Subject['id']): Promise<void>;
}
