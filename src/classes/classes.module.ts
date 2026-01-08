import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { RelationalClassPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { StudentsModule } from '../students/students.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { TeachersModule } from '../teachers/teachers.module';
import { FilesModule } from '../files/files.module';
import { LearningModuleEntity } from '../learning-modules/infrastructure/persistence/relational/entities/learning-module.entity';
import { LearningModuleSectionEntity } from '../learning-modules/infrastructure/persistence/relational/entities/learning-module-section.entity';
import { AssignmentEntity } from '../assignments/infrastructure/persistence/relational/entities/assignment.entity';

const infrastructurePersistenceModule = RelationalClassPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    forwardRef(() => StudentsModule),
    SubjectsModule,
    TeachersModule,
    FilesModule,
    TypeOrmModule.forFeature([
      LearningModuleEntity,
      LearningModuleSectionEntity,
      AssignmentEntity,
    ]),
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService, infrastructurePersistenceModule],
})
export class ClassesModule {}
