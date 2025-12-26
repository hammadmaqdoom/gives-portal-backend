import { Module } from '@nestjs/common';
import { TeacherRepository } from '../teacher.repository';
import { TeachersRelationalRepository } from './repositories/teacher.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherEntity } from './entities/teacher.entity';
import { TeacherMapper } from './mappers/teacher.mapper';
import { RelationalFilePersistenceModule } from '../../../../files/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeacherEntity]),
    RelationalFilePersistenceModule,
  ],
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
