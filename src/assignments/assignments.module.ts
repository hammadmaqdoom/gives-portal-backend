import { Module, forwardRef } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { RelationalAssignmentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AnnotationsModule } from '../annotations/annotations.module';
import { FilesModule } from '../files/files.module';

const infrastructurePersistenceModule = RelationalAssignmentPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, AnnotationsModule, forwardRef(() => FilesModule)],
  controllers: [AssignmentsController, SubmissionsController],
  providers: [AssignmentsService, SubmissionsService],
  exports: [
    AssignmentsService,
    SubmissionsService,
    infrastructurePersistenceModule,
  ],
})
export class AssignmentsModule {}
