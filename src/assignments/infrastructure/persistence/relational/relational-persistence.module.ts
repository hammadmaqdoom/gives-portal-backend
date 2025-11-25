import { Module } from '@nestjs/common';
import { AssignmentRepository } from '../assignment.repository';
import { SubmissionRepository } from '../submission.repository';
import { AssignmentsRelationalRepository } from './repositories/assignment.repository';
import { SubmissionsRelationalRepository } from './repositories/submission.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentEntity } from './entities/assignment.entity';
import { SubmissionEntity } from './entities/submission.entity';
import { AssignmentMapper } from './mappers/assignment.mapper';
import { SubmissionMapper } from './mappers/submission.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([AssignmentEntity, SubmissionEntity])],
  providers: [
    {
      provide: AssignmentRepository,
      useClass: AssignmentsRelationalRepository,
    },
    {
      provide: SubmissionRepository,
      useClass: SubmissionsRelationalRepository,
    },
    AssignmentMapper,
    SubmissionMapper,
  ],
  exports: [AssignmentRepository, SubmissionRepository],
})
export class RelationalAssignmentPersistenceModule {}
