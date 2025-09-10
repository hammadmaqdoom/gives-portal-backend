import { Class } from '../../domain/class';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { FilterClassDto, SortClassDto } from '../../dto/query-class.dto';

export abstract class ClassRepository {
  abstract create(data: Partial<Class>): Promise<Class>;

  abstract findById(id: Class['id']): Promise<NullableType<Class>>;

  abstract findByName(name: Class['name']): Promise<NullableType<Class>>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterClassDto | null;
    sortOptions?: SortClassDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Class[]>;

  abstract update(id: Class['id'], data: Partial<Class>): Promise<Class | null>;

  abstract remove(id: Class['id']): Promise<void>;
}
