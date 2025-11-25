import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { RelationalPerformancePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalPerformancePersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService, infrastructurePersistenceModule],
})
export class PerformanceModule {}
