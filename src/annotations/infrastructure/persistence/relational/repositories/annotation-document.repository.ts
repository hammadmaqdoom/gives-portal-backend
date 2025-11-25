import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AnnotationDocument } from '../../../../domain/annotation';
import { AnnotationDocumentEntity } from '../entities/annotation-document.entity';

@Injectable()
export class AnnotationDocumentRepository {
  constructor(
    @InjectRepository(AnnotationDocumentEntity)
    private readonly annotationDocumentRepository: Repository<AnnotationDocumentEntity>,
  ) {}

  async create(data: Partial<AnnotationDocument>): Promise<AnnotationDocument> {
    const entity = this.annotationDocumentRepository.create(data);
    const saved = await this.annotationDocumentRepository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<AnnotationDocument | null> {
    const entity = await this.annotationDocumentRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySubmissionId(
    submissionId: string,
  ): Promise<AnnotationDocument | null> {
    const entity = await this.annotationDocumentRepository.findOne({
      where: { submissionId, deletedAt: IsNull() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFileId(fileId: string): Promise<AnnotationDocument | null> {
    const entity = await this.annotationDocumentRepository.findOne({
      where: { fileId, deletedAt: IsNull() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async update(
    id: string,
    data: Partial<AnnotationDocument>,
  ): Promise<AnnotationDocument> {
    await this.annotationDocumentRepository.update(id, {
      ...data,
      version: () => 'version + 1', // Increment version
    });
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Annotation document not found after update');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.annotationDocumentRepository.softDelete(id);
  }

  private toDomain(entity: AnnotationDocumentEntity): AnnotationDocument {
    return {
      id: entity.id,
      submissionId: entity.submissionId,
      fileId: entity.fileId,
      layers: entity.layers,
      version: entity.version,
      lastSaved: entity.updatedAt,
    };
  }
}
