import { Injectable, NotFoundException } from '@nestjs/common';
import { AnnotationDocument } from './domain/annotation';
import { AnnotationDocumentRepository } from './infrastructure/persistence/relational/repositories/annotation-document.repository';
import { CreateAnnotationDocumentDto } from './dto/create-annotation-document.dto';
import { UpdateAnnotationDocumentDto } from './dto/update-annotation-document.dto';

@Injectable()
export class AnnotationsService {
  constructor(
    private readonly annotationDocumentRepository: AnnotationDocumentRepository,
  ) {}

  async create(
    createAnnotationDocumentDto: CreateAnnotationDocumentDto,
  ): Promise<AnnotationDocument> {
    return this.annotationDocumentRepository.create(
      createAnnotationDocumentDto,
    );
  }

  async findById(id: string): Promise<AnnotationDocument> {
    const document = await this.annotationDocumentRepository.findById(id);
    if (!document) {
      throw new NotFoundException('Annotation document not found');
    }
    return document;
  }

  async findBySubmissionId(
    submissionId: string,
  ): Promise<AnnotationDocument | null> {
    return this.annotationDocumentRepository.findBySubmissionId(submissionId);
  }

  async findByFileId(fileId: string): Promise<AnnotationDocument | null> {
    return this.annotationDocumentRepository.findByFileId(fileId);
  }

  async update(
    id: string,
    updateAnnotationDocumentDto: UpdateAnnotationDocumentDto,
  ): Promise<AnnotationDocument> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Annotation document not found');
    }
    return this.annotationDocumentRepository.update(
      id,
      updateAnnotationDocumentDto,
    );
  }

  async saveOrUpdate(
    submissionId: string,
    fileId: string,
    layers: any[],
  ): Promise<AnnotationDocument> {
    // Try to find existing document
    const document =
      await this.annotationDocumentRepository.findBySubmissionId(submissionId);

    if (document) {
      // Update existing document
      return this.annotationDocumentRepository.update(document.id, { layers });
    } else {
      // Create new document
      return this.annotationDocumentRepository.create({
        submissionId,
        fileId,
        layers,
      });
    }
  }

  async delete(id: string): Promise<void> {
    const document = await this.findById(id);
    if (!document) {
      throw new NotFoundException('Annotation document not found');
    }
    return this.annotationDocumentRepository.delete(id);
  }
}
