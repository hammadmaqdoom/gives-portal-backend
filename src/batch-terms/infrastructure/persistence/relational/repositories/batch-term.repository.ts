import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatchTermEntity } from '../entities/batch-term.entity';
import { BatchTerm } from '../../../../domain/batch-term';
import { BatchTermMapper } from '../mappers/batch-term.mapper';
import { BatchTermRepository } from '../../batch-term.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class BatchTermsRelationalRepository implements BatchTermRepository {
  constructor(
    @InjectRepository(BatchTermEntity)
    private readonly batchTermsRepository: Repository<BatchTermEntity>,
    private readonly batchTermMapper: BatchTermMapper,
  ) {}

  async create(data: Partial<BatchTerm>): Promise<BatchTerm> {
    const batchTermEntity = this.batchTermMapper.toPersistence(data);
    const newBatchTerm = await this.batchTermsRepository.save(batchTermEntity);
    return this.batchTermMapper.toDomain(newBatchTerm);
  }

  async findById(id: BatchTerm['id']): Promise<NullableType<BatchTerm>> {
    const batchTerm = await this.batchTermsRepository.findOne({
      where: { id },
    });
    return batchTerm ? this.batchTermMapper.toDomain(batchTerm) : null;
  }

  async findByName(name: BatchTerm['name']): Promise<NullableType<BatchTerm>> {
    const batchTerm = await this.batchTermsRepository.findOne({
      where: { name },
    });
    return batchTerm ? this.batchTermMapper.toDomain(batchTerm) : null;
  }

  async findAll(activeOnly: boolean = false): Promise<BatchTerm[]> {
    const queryBuilder =
      this.batchTermsRepository.createQueryBuilder('batch_term');

    if (activeOnly) {
      queryBuilder.where('batch_term.is_active = :isActive', {
        isActive: true,
      });
    }

    queryBuilder
      .orderBy('batch_term.display_order', 'ASC')
      .addOrderBy('batch_term.name', 'ASC');

    const batchTerms = await queryBuilder.getMany();
    return batchTerms.map((batchTerm) =>
      this.batchTermMapper.toDomain(batchTerm),
    );
  }

  async update(
    id: BatchTerm['id'],
    data: Partial<BatchTerm>,
  ): Promise<BatchTerm | null> {
    const batchTermEntity = this.batchTermMapper.toPersistence(data);
    await this.batchTermsRepository.update(id, batchTermEntity);
    const updated = await this.batchTermsRepository.findOne({
      where: { id },
    });
    return updated ? this.batchTermMapper.toDomain(updated) : null;
  }

  async remove(id: BatchTerm['id']): Promise<void> {
    await this.batchTermsRepository.softDelete(id);
  }
}
