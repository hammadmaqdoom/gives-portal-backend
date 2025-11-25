import { NullableType } from '../../../utils/types/nullable.type';
import { Parent } from '../../domain/parent';

export abstract class ParentRepository {
  abstract create(data: Partial<Parent>): Promise<Parent>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: any;
    sortOptions?: any;
    paginationOptions: any;
  }): Promise<Parent[]>;

  abstract findById(id: Parent['id']): Promise<NullableType<Parent>>;

  abstract findByEmail(email: Parent['email']): Promise<NullableType<Parent>>;

  abstract findByMobile(
    mobile: Parent['mobile'],
  ): Promise<NullableType<Parent>>;

  abstract findByUserId(userId: number): Promise<NullableType<Parent>>;

  abstract update(
    id: Parent['id'],
    data: Partial<Parent>,
  ): Promise<Parent | null>;

  abstract remove(id: Parent['id']): Promise<void>;
}
