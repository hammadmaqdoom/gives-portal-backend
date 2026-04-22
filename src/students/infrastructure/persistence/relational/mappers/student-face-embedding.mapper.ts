import { Injectable } from '@nestjs/common';
import { StudentFaceEmbeddingEntity } from '../entities/student-face-embedding.entity';
import { StudentFaceEmbedding } from '../../../../domain/student-face-embedding';

@Injectable()
export class StudentFaceEmbeddingMapper {
  toDomain(raw: StudentFaceEmbeddingEntity): StudentFaceEmbedding {
    const domain = new StudentFaceEmbedding();
    domain.id = raw.id;
    domain.studentId = raw.studentId;
    domain.embedding = raw.embedding;
    domain.modelName = raw.modelName;
    domain.qualityScore = raw.qualityScore ?? null;
    domain.sourceFileId = raw.sourceFileId ?? null;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    domain.deletedAt = raw.deletedAt ?? null;
    return domain;
  }

  toPersistence(
    data: Partial<StudentFaceEmbedding>,
  ): Partial<StudentFaceEmbeddingEntity> {
    const entity = new StudentFaceEmbeddingEntity();
    if (data.id !== undefined) entity.id = data.id;
    if (data.studentId !== undefined) entity.studentId = data.studentId;
    if (data.embedding !== undefined) entity.embedding = data.embedding;
    if (data.modelName !== undefined) entity.modelName = data.modelName;
    if (data.qualityScore !== undefined)
      entity.qualityScore = data.qualityScore ?? null;
    if (data.sourceFileId !== undefined)
      entity.sourceFileId = data.sourceFileId ?? null;
    return entity;
  }
}
