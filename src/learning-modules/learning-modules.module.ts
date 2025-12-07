import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningModuleEntity } from './infrastructure/persistence/relational/entities/learning-module.entity';
import { LearningModuleSectionEntity } from './infrastructure/persistence/relational/entities/learning-module-section.entity';
import { ModuleCompletionEntity } from './infrastructure/persistence/relational/entities/module-completion.entity';
import { LearningModulesService } from './learning-modules.service';
import { AccessControlModule } from '../access-control/access-control.module';
import {
  LearningModulesController,
  LearningModuleSectionsController,
} from './learning-modules.controller';
import { ModuleCompletionService } from './module-completion.service';
import { ModuleCompletionController } from './module-completion.controller';
import { ModuleCompletionRepository } from './infrastructure/persistence/relational/repositories/module-completion.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningModuleEntity,
      LearningModuleSectionEntity,
      ModuleCompletionEntity,
    ]),
    forwardRef(() => AccessControlModule),
  ],
  controllers: [
    LearningModulesController,
    LearningModuleSectionsController,
    ModuleCompletionController,
  ],
  providers: [
    LearningModulesService,
    ModuleCompletionService,
    {
      provide: ModuleCompletionRepository,
      useClass: ModuleCompletionRepository,
    },
  ],
  exports: [LearningModulesService, ModuleCompletionService],
})
export class LearningModulesModule {}
