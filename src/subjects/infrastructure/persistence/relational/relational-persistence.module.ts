import { Module } from '@nestjs/common';
import { SubjectRepository } from '../subject.repository';
import { SubjectsRelationalRepository } from './repositories/subject.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectEntity } from './entities/subject.entity';
import { SubjectMapper } from './mappers/subject.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([SubjectEntity])],
  providers: [
    {
      provide: SubjectRepository,
      useClass: SubjectsRelationalRepository,
    },
    SubjectMapper,
  ],
  exports: [SubjectRepository],
})
export class RelationalSubjectPersistenceModule {}
