import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../entities/file.entity';
import { File } from '../../../../domain/file';
import { FileMapper } from '../mappers/file.mapper';

@Injectable()
export class FileRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly fileMapper: FileMapper,
  ) {}

  async create(fileData: Partial<File>): Promise<File> {
    const fileEntity = this.fileMapper.toPersistence(fileData);
    const savedFile = await this.fileRepository.save(fileEntity);
    return this.fileMapper.toDomain(savedFile);
  }

  async findById(id: string): Promise<File | null> {
    const file = await this.fileRepository.findOne({ where: { id } });
    return file ? this.fileMapper.toDomain(file) : null;
  }

  async findAll(): Promise<File[]> {
    console.log('FileRepository: Finding all files');
    const files = await this.fileRepository.find({
      order: { uploadedAt: 'DESC' },
    });
    console.log(`FileRepository: Raw files from database:`, files);
    const mappedFiles = files.map((file) => this.fileMapper.toDomain(file));
    console.log(`FileRepository: Mapped files:`, mappedFiles);
    return mappedFiles;
  }

  async findByContext(contextType: string, contextId: string): Promise<File[]> {
    console.log(
      `FileRepository: Finding files for context ${contextType}:${contextId}`,
    );
    const files = await this.fileRepository.find({
      where: { contextType, contextId },
      order: { uploadedAt: 'DESC' },
    });
    console.log(`FileRepository: Raw files from database:`, files);
    const mappedFiles = files.map((file) => this.fileMapper.toDomain(file));
    console.log(`FileRepository: Mapped files:`, mappedFiles);
    return mappedFiles;
  }

  async findByIds(ids: string[]): Promise<File[]> {
    const files = await this.fileRepository.findByIds(ids);
    return files.map((file) => this.fileMapper.toDomain(file));
  }

  async findByUploadedBy(uploadedBy: string): Promise<File[]> {
    const files = await this.fileRepository.find({
      where: { uploadedBy },
      order: { uploadedAt: 'DESC' },
    });
    return files.map((file) => this.fileMapper.toDomain(file));
  }

  async findByPath(filePath: string): Promise<File | null> {
    console.log(`FileRepository: Looking for file with path: ${filePath}`);
    const file = await this.fileRepository.findOne({
      where: { path: filePath },
    });
    console.log(`FileRepository: File found:`, file ? file.id : 'not found');
    return file ? this.fileMapper.toDomain(file) : null;
  }

  async findByFilename(filename: string): Promise<File | null> {
    console.log(`FileRepository: Looking for file with filename: ${filename}`);
    const file = await this.fileRepository.findOne({
      where: { filename },
    });
    console.log(
      `FileRepository: File found by filename:`,
      file ? file.id : 'not found',
    );
    return file ? this.fileMapper.toDomain(file) : null;
  }

  async update(id: string, data: Partial<File>): Promise<File | null> {
    const fileEntity = this.fileMapper.toPersistence(data);
    await this.fileRepository.update(id, fileEntity);
    // Fetch the updated entity
    const updatedFile = await this.fileRepository.findOne({ where: { id } });
    return updatedFile ? this.fileMapper.toDomain(updatedFile) : null;
  }

  async delete(id: string): Promise<void> {
    await this.fileRepository.delete(id);
  }

  async deleteByContext(contextType: string, contextId: string): Promise<void> {
    await this.fileRepository.delete({ contextType, contextId });
  }

  async findByMultipleContexts(
    contexts: Array<{ contextType: string; contextId: string }>,
  ): Promise<File[]> {
    if (contexts.length === 0) {
      return [];
    }

    // Build query with OR conditions for multiple contexts
    const queryBuilder = this.fileRepository.createQueryBuilder('file');
    
    const parameters: Record<string, any> = {};
    const conditions: string[] = [];
    
    contexts.forEach((context, index) => {
      const typeParam = `contextType${index}`;
      const idParam = `contextId${index}`;
      parameters[typeParam] = context.contextType;
      parameters[idParam] = context.contextId;
      conditions.push(`(file.contextType = :${typeParam} AND file.contextId = :${idParam})`);
    });

    queryBuilder.where(conditions.join(' OR '), parameters);
    queryBuilder.orderBy('file.uploadedAt', 'DESC');
    
    const files = await queryBuilder.getMany();
    return files.map((file) => this.fileMapper.toDomain(file));
  }

  async remove(id: string): Promise<void> {
    await this.fileRepository.softDelete(id);
  }
}
