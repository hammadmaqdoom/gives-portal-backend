import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { RelationalAssignmentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalAssignmentPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [AssignmentsController, SubmissionsController],
  providers: [AssignmentsService, SubmissionsService],
  exports: [
    AssignmentsService,
    SubmissionsService,
    infrastructurePersistenceModule,
  ],
})
export class AssignmentsModule {}
