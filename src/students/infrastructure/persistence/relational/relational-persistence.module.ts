import { Module } from '@nestjs/common';
import { StudentRepository } from '../student.repository';
import { StudentsRelationalRepository } from './repositories/student.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { StudentMapper } from './mappers/student.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity])],
  providers: [
    {
      provide: StudentRepository,
      useClass: StudentsRelationalRepository,
    },
    StudentMapper,
  ],
  exports: [StudentRepository],
})
export class RelationalStudentPersistenceModule {}
