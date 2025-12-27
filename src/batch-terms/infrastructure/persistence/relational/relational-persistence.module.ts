import { Module } from '@nestjs/common';
import { BatchTermRepository } from '../batch-term.repository';
import { BatchTermsRelationalRepository } from './repositories/batch-term.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchTermEntity } from './entities/batch-term.entity';
import { BatchTermMapper } from './mappers/batch-term.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([BatchTermEntity])],
  providers: [
    {
      provide: BatchTermRepository,
      useClass: BatchTermsRelationalRepository,
    },
    BatchTermMapper,
  ],
  exports: [BatchTermRepository],
})
export class RelationalBatchTermPersistenceModule {}

