import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelationalFilePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FileStorageService } from './file-storage.service';
import { FileEntity } from './infrastructure/persistence/relational/entities/file.entity';
import { FileMapper } from './infrastructure/persistence/relational/mappers/file.mapper';
import { FileRepository } from './infrastructure/persistence/relational/repositories/file.repository';

@Module({
  imports: [
    RelationalFilePersistenceModule,
    TypeOrmModule.forFeature([FileEntity]),
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
