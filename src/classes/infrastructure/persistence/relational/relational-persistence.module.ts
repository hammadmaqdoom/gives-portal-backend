import { Module } from '@nestjs/common';
import { ClassRepository } from '../class.repository';
import { ClassesRelationalRepository } from './repositories/class.repository';
import { ClassScheduleRepository } from './repositories/class-schedule.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from './entities/class.entity';
import { ClassScheduleEntity } from './entities/class-schedule.entity';
import { ClassMapper } from './mappers/class.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, ClassScheduleEntity])],
  providers: [
    {
      provide: ClassRepository,
      useClass: ClassesRelationalRepository,
    },
    ClassMapper,
    ClassScheduleRepository,
  ],
  exports: [ClassRepository],
})
export class RelationalClassPersistenceModule {}
