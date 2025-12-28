import { Module } from '@nestjs/common';
import { BatchTermsService } from './batch-terms.service';
import { BatchTermsController } from './batch-terms.controller';
import { RelationalBatchTermPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalBatchTermPersistenceModule],
  controllers: [BatchTermsController],
  providers: [BatchTermsService],
  exports: [BatchTermsService, RelationalBatchTermPersistenceModule],
})
export class BatchTermsModule {}

