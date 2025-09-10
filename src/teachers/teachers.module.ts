import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { TeacherCommissionController } from './teacher-commission.controller';
import { TeacherCommissionService } from './teacher-commission.service';
import { RelationalTeacherPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RelationalTeacherCommissionPersistenceModule } from './infrastructure/persistence/relational/relational-teacher-commission-persistence.module';
import { UsersModule } from '../users/users.module';

const infrastructurePersistenceModule = RelationalTeacherPersistenceModule;
const commissionPersistenceModule =
  RelationalTeacherCommissionPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    commissionPersistenceModule,
    UsersModule,
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
