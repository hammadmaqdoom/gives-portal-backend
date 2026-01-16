import { BatchTerm } from '../../domain/batch-term';
import { NullableType } from '../../../utils/types/nullable.type';

export abstract class BatchTermRepository {
  abstract create(data: Partial<BatchTerm>): Promise<BatchTerm>;

  abstract findById(id: BatchTerm['id']): Promise<NullableType<BatchTerm>>;

  abstract findByName(
    name: BatchTerm['name'],
  ): Promise<NullableType<BatchTerm>>;

  abstract findAll(activeOnly?: boolean): Promise<BatchTerm[]>;

  abstract update(
    id: BatchTerm['id'],
    data: Partial<BatchTerm>,
  ): Promise<BatchTerm | null>;

  abstract remove(id: BatchTerm['id']): Promise<void>;
}
