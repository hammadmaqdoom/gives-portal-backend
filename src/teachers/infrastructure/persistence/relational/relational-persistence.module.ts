import { Module } from '@nestjs/common';
import { TeacherRepository } from '../teacher.repository';
import { TeachersRelationalRepository } from './repositories/teacher.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherEntity } from './entities/teacher.entity';
import { TeacherMapper } from './mappers/teacher.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherEntity])],
  providers: [
    {
      provide: TeacherRepository,
      useClass: TeachersRelationalRepository,
    },
    TeacherMapper,
  ],
  exports: [TeacherRepository],
})
export class RelationalTeacherPersistenceModule {}
