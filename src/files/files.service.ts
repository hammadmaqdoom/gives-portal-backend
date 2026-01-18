import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileRepository } from './infrastructure/persistence/relational/repositories/file.repository';
import { File } from './domain/file';
import {
  FileStorageService,
  FileUploadContext,
  UploadedFileInfo,
} from './file-storage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningModuleEntity } from '../learning-modules/infrastructure/persistence/relational/entities/learning-module.entity';
import { AssignmentsService } from '../assignments/assignments.service';
import { SubmissionsService } from '../assignments/submissions.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly configService: ConfigService,
    @InjectRepository(LearningModuleEntity)
    private readonly learningModuleRepo: Repository<LearningModuleEntity>,
    @Inject(forwardRef(() => AssignmentsService))
    private readonly assignmentsService: AssignmentsService,
    @Inject(forwardRef(() => SubmissionsService))
    private readonly submissionsService: SubmissionsService,
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

  /**
   * Get files by class ID
   */
  async getFilesByClass(classId: number): Promise<File[]> {
    return this.getFilesByContext('class', classId.toString());
  }

  /**
   * Get files by class ID filtered by user role
   * - For students: Only returns files from assignments and their own submissions
   * - For admins/teachers/superadmins: Returns all files for the class
   */
  async getFilesByClassFilteredByRole(
    classId: number,
    userRole: string,
    studentId?: number,
  ): Promise<File[]> {
    const normalizedRole = userRole?.toLowerCase();

    // For admins, teachers, and superadmins, return all files
    if (
      normalizedRole === 'admin' ||
      normalizedRole === 'teacher' ||
      normalizedRole === 'superadmin'
    ) {
      // Get all files with different context types for the class
      const classFiles = await this.getFilesByContext('class', classId.toString());
      
      // Get assignment files
      const assignments = await this.assignmentsService.findByClass(classId);
      const assignmentContexts = assignments.map((assignment) => ({
        contextType: 'assignment',
        contextId: assignment.id.toString(),
      }));
      const assignmentFiles =
        assignmentContexts.length > 0
          ? await this.fileRepository.findByMultipleContexts(assignmentContexts)
          : [];

      // Get submission files
      const allSubmissions: any[] = [];
      for (const assignment of assignments) {
        const submissions = await this.submissionsService.findByAssignment(
          assignment.id,
        );
        allSubmissions.push(...submissions);
      }
      const submissionContexts = allSubmissions.map((submission) => ({
        contextType: 'submission',
        contextId: submission.id.toString(),
      }));
      const submissionFiles =
        submissionContexts.length > 0
          ? await this.fileRepository.findByMultipleContexts(submissionContexts)
          : [];

      // Get module files
      const moduleFiles = await this.getFilesByContext('module', classId.toString());

      // Combine all files and remove duplicates
      const allFiles = [
        ...classFiles,
        ...assignmentFiles,
        ...submissionFiles,
        ...moduleFiles,
      ];
      const uniqueFiles = Array.from(
        new Map(allFiles.map((file) => [file.id, file])).values(),
      );
      return uniqueFiles;
    }

    // For students, only return assignment files and their own submission files
    if (normalizedRole === 'user' && studentId) {
      // Get assignments for the class
      const assignments = await this.assignmentsService.findByClass(classId);
      const assignmentContexts = assignments.map((assignment) => ({
        contextType: 'assignment',
        contextId: assignment.id.toString(),
      }));
      const assignmentFiles =
        assignmentContexts.length > 0
          ? await this.fileRepository.findByMultipleContexts(assignmentContexts)
          : [];

      // Get student's own submissions for assignments in this class
      const studentSubmissions = await this.submissionsService.findByStudent(
        studentId,
      );
      const classAssignmentIds = new Set(assignments.map((a) => a.id));
      const relevantSubmissions = studentSubmissions.filter(
        (submission) =>
          submission.assignment &&
          classAssignmentIds.has(submission.assignment.id),
      );

      const submissionContexts = relevantSubmissions.map((submission) => ({
        contextType: 'submission',
        contextId: submission.id.toString(),
      }));
      const submissionFiles =
        submissionContexts.length > 0
          ? await this.fileRepository.findByMultipleContexts(submissionContexts)
          : [];

      // Combine assignment and submission files
      const allFiles = [...assignmentFiles, ...submissionFiles];
      const uniqueFiles = Array.from(
        new Map(allFiles.map((file) => [file.id, file])).values(),
      );
      return uniqueFiles;
    }

    // Default: return empty array for unknown roles
    return [];
  }

  /**
   * Delete a class file
   */
  async deleteClassFile(fileId: string, classId: number): Promise<void> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new BadRequestException('File not found');
    }

    // Verify the file belongs to the specified class
    if (file.contextType !== 'class' || file.contextId !== classId.toString()) {
      throw new BadRequestException('File does not belong to this class');
    }

    // Delete from storage
    await this.fileStorageService.deleteFile(file.path);

    // Delete from database
    await this.fileRepository.delete(fileId);
  }

  /**
   * Check if a file is being used by any learning modules
   */
  async checkFileUsageInModules(fileId: string): Promise<LearningModuleEntity[]> {
    return this.learningModuleRepo.find({
      where: { videoFileId: fileId },
    });
  }
}
