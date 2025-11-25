import { Fee } from '../../domain/fee';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { FilterFeeDto, SortFeeDto } from '../../dto/query-fee.dto';

export abstract class FeeRepository {
  abstract create(data: Partial<Fee>): Promise<Fee>;

  abstract findById(id: Fee['id']): Promise<NullableType<Fee>>;

  abstract findByStudent(studentId: number): Promise<Fee[]>;

  abstract findByClass(classId: number): Promise<Fee[]>;

  abstract findByStudentAndClass(
    studentId: number,
    classId: number,
  ): Promise<Fee[]>;

  abstract findOverdueFees(): Promise<Fee[]>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterFeeDto | null;
    sortOptions?: SortFeeDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Fee[]>;

  abstract update(id: Fee['id'], data: Partial<Fee>): Promise<Fee | null>;

  abstract remove(id: Fee['id']): Promise<void>;
}
