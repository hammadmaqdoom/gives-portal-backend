import { Injectable } from '@nestjs/common';
import { BatchTermEntity } from '../entities/batch-term.entity';
import { BatchTerm } from '../../../../domain/batch-term';

@Injectable()
export class BatchTermMapper {
  toDomain(raw: BatchTermEntity): BatchTerm {
    const batchTerm = new BatchTerm();
    batchTerm.id = raw.id;
    batchTerm.name = raw.name;
    batchTerm.description = raw.description;
    batchTerm.isActive = raw.isActive;
    batchTerm.displayOrder = raw.displayOrder;
    batchTerm.createdAt = raw.createdAt;
    batchTerm.updatedAt = raw.updatedAt;
    batchTerm.deletedAt = raw.deletedAt;
    return batchTerm;
  }

  toPersistence(batchTerm: Partial<BatchTerm>): Partial<BatchTermEntity> {
    const batchTermEntity = new BatchTermEntity();

    if (batchTerm.id !== undefined) {
      batchTermEntity.id = batchTerm.id;
    }
    if (batchTerm.name !== undefined) {
      batchTermEntity.name = batchTerm.name;
    }
    if (batchTerm.description !== undefined) {
      batchTermEntity.description = batchTerm.description;
    }
    if (batchTerm.isActive !== undefined) {
      batchTermEntity.isActive = batchTerm.isActive;
    }
    if (batchTerm.displayOrder !== undefined) {
      batchTermEntity.displayOrder = batchTerm.displayOrder;
    }

    return batchTermEntity;
  }
}
