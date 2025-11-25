import { Module } from '@nestjs/common';
import { FeeRepository } from '../fee.repository';
import { FeesRelationalRepository } from './repositories/fee.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeEntity } from './entities/fee.entity';
import { FeeMapper } from './mappers/fee.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([FeeEntity])],
  providers: [
    {
      provide: FeeRepository,
      useClass: FeesRelationalRepository,
    },
    FeeMapper,
  ],
  exports: [FeeRepository],
})
export class RelationalFeePersistenceModule {}
