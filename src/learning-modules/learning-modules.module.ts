import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningModuleEntity } from './infrastructure/persistence/relational/entities/learning-module.entity';
import { LearningModuleSectionEntity } from './infrastructure/persistence/relational/entities/learning-module-section.entity';
import { ModuleCompletionEntity } from './infrastructure/persistence/relational/entities/module-completion.entity';
import { StudentModuleNoteEntity } from './infrastructure/persistence/relational/entities/student-module-note.entity';
import { LearningModulesService } from './learning-modules.service';
import { AccessControlModule } from '../access-control/access-control.module';
import { FilesModule } from '../files/files.module';
import { TeachersModule } from '../teachers/teachers.module';
import { ClassesModule } from '../classes/classes.module';
import {
  LearningModulesController,
  LearningModuleSectionsController,
} from './learning-modules.controller';
import { ModuleCompletionService } from './module-completion.service';
import { ModuleCompletionController } from './module-completion.controller';
import { ModuleCompletionRepository } from './infrastructure/persistence/relational/repositories/module-completion.repository';
import { StudentModuleNoteService } from './student-module-note.service';
import { StudentModuleNoteController } from './student-module-note.controller';
import { StudentModuleNoteRepository } from './infrastructure/persistence/relational/repositories/student-module-note.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningModuleEntity,
      LearningModuleSectionEntity,
      ModuleCompletionEntity,
      StudentModuleNoteEntity,
    ]),
    forwardRef(() => AccessControlModule),
    forwardRef(() => FilesModule),
    forwardRef(() => TeachersModule),
    forwardRef(() => ClassesModule),
  ],
  controllers: [
    LearningModulesController,
    LearningModuleSectionsController,
    ModuleCompletionController,
    StudentModuleNoteController,
  ],
  providers: [
    LearningModulesService,
    ModuleCompletionService,
    StudentModuleNoteService,
    {
      provide: ModuleCompletionRepository,
      useClass: ModuleCompletionRepository,
    },
    {
      provide: StudentModuleNoteRepository,
      useClass: StudentModuleNoteRepository,
    },
  ],
  exports: [LearningModulesService, ModuleCompletionService, StudentModuleNoteService],
})
export class LearningModulesModule {}
