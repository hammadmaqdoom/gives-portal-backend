import { Module } from '@nestjs/common';
import { TeacherCommissionRepository } from '../teacher-commission.repository';
import { TeacherCommissionsRelationalRepository } from './repositories/teacher-commission.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherCommissionEntity } from './entities/teacher-commission.entity';
import { TeacherCommissionMapper } from './mappers/teacher-commission.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherCommissionEntity])],
  providers: [
    {
      provide: TeacherCommissionRepository,
      useClass: TeacherCommissionsRelationalRepository,
    },
    TeacherCommissionMapper,
  ],
  exports: [TeacherCommissionRepository],
})
export class RelationalTeacherCommissionPersistenceModule {}
