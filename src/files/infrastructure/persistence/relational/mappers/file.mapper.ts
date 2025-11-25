import { Injectable } from '@nestjs/common';
import { FileEntity } from '../entities/file.entity';
import { File } from '../../../../domain/file';

@Injectable()
export class FileMapper {
  toDomain(raw: FileEntity): File {
    const file = new File();
    file.id = raw.id;
    file.filename = raw.filename;
    file.originalName = raw.originalName;
    file.path = raw.path;
    file.url = raw.url;
    file.size = raw.size;
    file.mimeType = raw.mimeType;
    file.uploadedBy = raw.uploadedBy;
    file.uploadedAt = raw.uploadedAt;
    file.contextType = raw.contextType;
    file.contextId = raw.contextId;
    file.createdAt = raw.createdAt;
    file.updatedAt = raw.updatedAt;
    file.deletedAt = raw.deletedAt;
    return file;
  }

  toPersistence(file: Partial<File>): Partial<FileEntity> {
    const fileEntity = new FileEntity();

    if (file.id !== undefined) fileEntity.id = file.id;
    if (file.filename !== undefined) fileEntity.filename = file.filename;
    if (file.originalName !== undefined)
      fileEntity.originalName = file.originalName;
    if (file.path !== undefined) fileEntity.path = file.path;
    if (file.url !== undefined) fileEntity.url = file.url;
    if (file.size !== undefined) fileEntity.size = file.size;
    if (file.mimeType !== undefined) fileEntity.mimeType = file.mimeType;
    if (file.uploadedBy !== undefined) fileEntity.uploadedBy = file.uploadedBy;
    if (file.uploadedAt !== undefined) fileEntity.uploadedAt = file.uploadedAt;
    if (file.contextType !== undefined)
      fileEntity.contextType = file.contextType;
    if (file.contextId !== undefined) fileEntity.contextId = file.contextId;
    if (file.createdAt !== undefined) fileEntity.createdAt = file.createdAt;
    if (file.updatedAt !== undefined) fileEntity.updatedAt = file.updatedAt;
    if (file.deletedAt !== undefined) fileEntity.deletedAt = file.deletedAt;

    return fileEntity;
  }

  // Static methods for backward compatibility
  static toDomain(raw: FileEntity): File {
    const mapper = new FileMapper();
    return mapper.toDomain(raw);
  }

  static toPersistence(file: Partial<File>): Partial<FileEntity> {
    const mapper = new FileMapper();
    return mapper.toPersistence(file);
  }
}
