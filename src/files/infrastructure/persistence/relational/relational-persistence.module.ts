import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { FileRepository } from './repositories/file.repository';
import { FileMapper } from './mappers/file.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [FileRepository, FileMapper],
  exports: [FileRepository, FileMapper],
})
export class RelationalFilePersistenceModule {}
