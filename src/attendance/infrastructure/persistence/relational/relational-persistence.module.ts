import { Module } from '@nestjs/common';
import { AttendanceRepository } from '../attendance.repository';
import { AttendancesRelationalRepository } from './repositories/attendance.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from './entities/attendance.entity';
import { AttendanceMapper } from './mappers/attendance.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity])],
  providers: [
    {
      provide: AttendanceRepository,
      useClass: AttendancesRelationalRepository,
    },
    AttendanceMapper,
  ],
  exports: [AttendanceRepository],
})
export class RelationalAttendancePersistenceModule {}
