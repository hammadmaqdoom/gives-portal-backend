import { Module, forwardRef } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelationalFilePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FileStorageService } from './file-storage.service';
import { FileEntity } from './infrastructure/persistence/relational/entities/file.entity';
import { FileMapper } from './infrastructure/persistence/relational/mappers/file.mapper';
import { FileRepository } from './infrastructure/persistence/relational/repositories/file.repository';
import { AccessControlModule } from '../access-control/access-control.module';
import { ClassesModule } from '../classes/classes.module';
import { LearningModulesModule } from '../learning-modules/learning-modules.module';
import { LearningModuleEntity } from '../learning-modules/infrastructure/persistence/relational/entities/learning-module.entity';
import { AssignmentsModule } from '../assignments/assignments.module';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    RelationalFilePersistenceModule,
    TypeOrmModule.forFeature([FileEntity, LearningModuleEntity]),
    forwardRef(() => SettingsModule),
    forwardRef(() => AccessControlModule),
    forwardRef(() => ClassesModule),
    forwardRef(() => LearningModulesModule),
    forwardRef(() => AssignmentsModule),
    forwardRef(() => StudentsModule),
  ],
  controllers: [FilesController],
  providers: [FilesService, FileStorageService, FileMapper, FileRepository],
  exports: [
    FilesService,
    FileStorageService,
    FileRepository,
    RelationalFilePersistenceModule,
  ],
})
export class FilesModule {}
