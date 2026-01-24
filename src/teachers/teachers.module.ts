import { Module, forwardRef } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { TeacherCommissionController } from './teacher-commission.controller';
import { TeacherCommissionService } from './teacher-commission.service';
import { RelationalTeacherPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RelationalTeacherCommissionPersistenceModule } from './infrastructure/persistence/relational/relational-teacher-commission-persistence.module';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notifications/notification.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { FilesModule } from '../files/files.module';

const infrastructurePersistenceModule = RelationalTeacherPersistenceModule;
const commissionPersistenceModule =
  RelationalTeacherCommissionPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    commissionPersistenceModule,
    forwardRef(() => UsersModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => SubjectsModule),
    forwardRef(() => FilesModule),
  ],
  controllers: [TeachersController, TeacherCommissionController],
  providers: [TeachersService, TeacherCommissionService],
  exports: [
    TeachersService,
    TeacherCommissionService,
    infrastructurePersistenceModule,
    commissionPersistenceModule,
  ],
})
export class TeachersModule {}
