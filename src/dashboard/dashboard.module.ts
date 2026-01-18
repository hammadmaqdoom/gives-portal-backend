import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { StudentEntity } from '../students/infrastructure/persistence/relational/entities/student.entity';
import { TeacherEntity } from '../teachers/infrastructure/persistence/relational/entities/teacher.entity';
import { ClassEntity } from '../classes/infrastructure/persistence/relational/entities/class.entity';
import { AttendanceEntity } from '../attendance/infrastructure/persistence/relational/entities/attendance.entity';
import { FeeEntity } from '../fees/infrastructure/persistence/relational/entities/fee.entity';
import { PerformanceEntity } from '../performance/infrastructure/persistence/relational/entities/performance.entity';
import { AssignmentEntity } from '../assignments/infrastructure/persistence/relational/entities/assignment.entity';
import { SubmissionEntity } from '../assignments/infrastructure/persistence/relational/entities/submission.entity';
import { ParentEntity } from '../parents/infrastructure/persistence/relational/entities/parent.entity';
import { StudentClassEnrollmentEntity } from '../students/infrastructure/persistence/relational/entities/student-class-enrollment.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { FileEntity } from '../files/infrastructure/persistence/relational/entities/file.entity';
import { CurrencyModule } from '../currency/currency.module';
import { SettingsModule } from '../settings/settings.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentEntity,
      TeacherEntity,
      ClassEntity,
      AttendanceEntity,
      FeeEntity,
      PerformanceEntity,
      AssignmentEntity,
      SubmissionEntity,
      ParentEntity,
      StudentClassEnrollmentEntity,
      UserEntity,
      FileEntity,
    ]),
    CurrencyModule,
    SettingsModule,
    ConfigModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
