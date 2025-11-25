import { Module } from '@nestjs/common';
import { PerformanceRepository } from '../performance.repository';
import { PerformancesRelationalRepository } from './repositories/performance.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceEntity } from './entities/performance.entity';
import { PerformanceMapper } from './mappers/performance.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceEntity])],
  providers: [
    {
      provide: PerformanceRepository,
      useClass: PerformancesRelationalRepository,
    },
    PerformanceMapper,
  ],
  exports: [PerformanceRepository],
})
export class RelationalPerformancePersistenceModule {}
