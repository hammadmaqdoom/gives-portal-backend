import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileRepository } from './infrastructure/persistence/relational/repositories/file.repository';
import { File } from './domain/file';
import {
  FileStorageService,
  FileUploadContext,
  UploadedFileInfo,
} from './file-storage.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Upload a single file with context
   */
  async uploadFileWithContext(
    file: Express.Multer.File,
    context: FileUploadContext,
  ): Promise<File> {
    // Upload file to storage
    const uploadedFileInfo =
      await this.fileStorageService.uploadFileWithContext(file, context);

    // Generate the file URL
    const fileUrl = this.fileStorageService.getFileUrl(uploadedFileInfo.path);

    // Save file metadata to database
    const fileRecord = await this.fileRepository.create({
      id: uploadedFileInfo.id,
      filename: uploadedFileInfo.filename,
      originalName: uploadedFileInfo.originalName,
      path: uploadedFileInfo.path,
      url: fileUrl,
      size: uploadedFileInfo.size,
      mimeType: uploadedFileInfo.mimeType,
      uploadedBy: uploadedFileInfo.uploadedBy.toString(),
      uploadedAt: uploadedFileInfo.uploadedAt,
      contextType: uploadedFileInfo.contextType,
      contextId: uploadedFileInfo.contextId.toString(),
    });

    return fileRecord;
  }

  /**
   * Upload multiple files with context
   */
  async uploadMultipleFilesWithContext(
    files: Express.Multer.File[],
    context: FileUploadContext,
  ): Promise<File[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) =>
      this.uploadFileWithContext(file, context),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Get all files (for debugging)
   */
  async getAllFiles(): Promise<File[]> {
    console.log('FilesService: Getting all files');
    const files = await this.fileRepository.findAll();
    console.log(`FilesService: Found ${files.length} total files`);
    return files;
  }

  /**
   * Get files by context
   */
  async getFilesByContext(
    contextType: string,
    contextId: string,
  ): Promise<File[]> {
    console.log(
      `FilesService: Getting files for context ${contextType}:${contextId}`,
    );
    const files = await this.fileRepository.findByContext(
      contextType,
      contextId,
    );
    console.log(`FilesService: Found ${files.length} files`);
    console.log('FilesService: Files:', files);
    return files;
  }

  /**
   * Get file by ID
   */
  async getFileById(id: string): Promise<File | null> {
    return this.fileRepository.findById(id);
  }

  /**
   * Get file by ID (alias for backward compatibility)
   */
  async findById(id: string): Promise<File | null> {
    return this.getFileById(id);
  }

  /**
   * Get files uploaded by a specific user
   */
  async getFilesByUser(userId: string): Promise<File[]> {
    return this.fileRepository.findByUploadedBy(userId);
  }

  /**
   * Get file by path (for backward compatibility)
   */
  async getFileByPath(filePath: string): Promise<File | null> {
    console.log(`FilesService: Looking for file with path: ${filePath}`);
    const file = await this.fileRepository.findByPath(filePath);
    console.log(`FilesService: File found:`, file ? file.id : 'not found');
    return file;
  }

  /**
   * Get file by filename
   */
  async getFileByFilename(filename: string): Promise<File | null> {
    console.log(`FilesService: Looking for file with filename: ${filename}`);
    const file = await this.fileRepository.findByFilename(filename);
    console.log(
      `FilesService: File found by filename:`,
      file ? file.id : 'not found',
    );
    return file;
  }

  /**
   * Delete a file
   */
  async deleteFile(id: string): Promise<void> {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new BadRequestException('File not found');
    }

    // Delete from storage
    await this.fileStorageService.deleteFile(file.path);

    // Delete from database
    await this.fileRepository.delete(id);
  }

  /**
   * Delete all files for a specific context
   */
  async deleteFilesByContext(
    contextType: string,
    contextId: string,
  ): Promise<void> {
    const files = await this.fileRepository.findByContext(
      contextType,
      contextId,
    );

    // Delete all files from storage
    const deletePromises = files.map((file) =>
      this.fileStorageService.deleteFile(file.path),
    );
    await Promise.all(deletePromises);

    // Delete all file records from database
    await this.fileRepository.deleteByContext(contextType, contextId);
  }

  /**
   * Get full file path for local storage
   */
  getFullFilePath(relativePath: string): string {
    const path = require('path');
    // The path is already relative to the project root, just resolve it
    return path.resolve(process.cwd(), relativePath);
  }

  /**
   * Get file URL for access
   */
  getFileUrl(file: File): string {
    return this.fileStorageService.getFileUrl(file.path);
  }

  /**
   * Update file metadata
   */
  async updateFile(id: string, fileData: Partial<File>): Promise<File | null> {
    return this.fileRepository.update(id, fileData);
  }
}
