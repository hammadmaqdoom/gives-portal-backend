import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { RelationalAttendancePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalAttendancePersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService, infrastructurePersistenceModule],
})
export class AttendanceModule {}
