import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnotationsService } from './annotations.service';
import { AnnotationsController } from './annotations.controller';
import { AnnotationDocumentEntity } from './infrastructure/persistence/relational/entities/annotation-document.entity';
import { AnnotationDocumentRepository } from './infrastructure/persistence/relational/repositories/annotation-document.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AnnotationDocumentEntity])],
  controllers: [AnnotationsController],
  providers: [AnnotationsService, AnnotationDocumentRepository],
  exports: [AnnotationsService],
})
export class AnnotationsModule {}
