import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningModuleEntity } from './infrastructure/persistence/relational/entities/learning-module.entity';
import { ModuleCompletionEntity } from './infrastructure/persistence/relational/entities/module-completion.entity';
import { LearningModulesService } from './learning-modules.service';
import { LearningModulesController } from './learning-modules.controller';
import { ModuleCompletionService } from './module-completion.service';
import { ModuleCompletionController } from './module-completion.controller';
import { ModuleCompletionRepository } from './infrastructure/persistence/relational/repositories/module-completion.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningModuleEntity, ModuleCompletionEntity]),
  ],
  controllers: [LearningModulesController, ModuleCompletionController],
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
