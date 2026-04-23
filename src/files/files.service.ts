import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
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
  private readonly logger = new Logger(FilesService.name);

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

  async uploadFileFromPathWithContext(
    sourcePath: string,
    fileMeta: { originalName: string; mimeType: string; size: number },
    context: FileUploadContext,
  ): Promise<File> {
    const uploadedFileInfo =
      await this.fileStorageService.uploadFileFromPathWithContext(
        sourcePath,
        fileMeta,
        context,
      );

    const fileUrl = this.fileStorageService.getFileUrl(uploadedFileInfo.path);

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
    const files = await this.fileRepository.findAll();
    this.logger.debug(`getAllFiles -> ${files.length} files`);
    return files;
  }

  /**
   * Get files by context
   */
  async getFilesByContext(
    contextType: string,
    contextId: string,
  ): Promise<File[]> {
    const files = await this.fileRepository.findByContext(
      contextType,
      contextId,
    );
    this.logger.debug(
      `getFilesByContext ${contextType}:${contextId} -> ${files.length} files`,
    );
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
    const file = await this.fileRepository.findByPath(filePath);
    this.logger.debug(
      `getFileByPath ${filePath} -> ${file ? file.id : 'not found'}`,
    );
    return file;
  }

  /**
   * Get file by filename
   */
  async getFileByFilename(filename: string): Promise<File | null> {
    const file = await this.fileRepository.findByFilename(filename);
    this.logger.debug(
      `getFileByFilename ${filename} -> ${file ? file.id : 'not found'}`,
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
   * Get module IDs belonging to a class
   */
  private async getModuleIdsByClass(classId: number): Promise<number[]> {
    const modules = await this.learningModuleRepo.find({
      where: { classId },
      select: ['id'],
    });
    return modules.map((m) => m.id);
  }

  /**
   * Get files for all modules in a class (queries by actual module IDs)
   */
  private async getModuleFilesByClass(classId: number): Promise<File[]> {
    const moduleIds = await this.getModuleIdsByClass(classId);
    if (moduleIds.length === 0) return [];

    const moduleContexts = moduleIds.map((id) => ({
      contextType: 'module',
      contextId: id.toString(),
    }));
    return this.fileRepository.findByMultipleContexts(moduleContexts);
  }

  /**
   * Get files by class ID filtered by user role
   * - For students: Returns class files, module files, assignment files, and their own submission files
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

      // Get module files using actual module IDs (not classId)
      const moduleFiles = await this.getModuleFilesByClass(classId);

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

    // For students, return class files, module files, assignment files, and own submission files
    if (normalizedRole === 'user' && studentId) {
      // Get class-level files (e.g. uploaded videos, PDFs for the class)
      const classFiles = await this.getFilesByContext('class', classId.toString());

      // Get module files for this class
      const moduleFiles = await this.getModuleFilesByClass(classId);

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

      // Combine all files and remove duplicates
      const allFiles = [
        ...classFiles,
        ...moduleFiles,
        ...assignmentFiles,
        ...submissionFiles,
      ];
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

  /**
   * Get class ID for a module by module ID (for module-context file access checks)
   */
  async getClassIdByModuleId(moduleId: number): Promise<number | null> {
    const module = await this.learningModuleRepo.findOne({
      where: { id: moduleId },
      select: ['classId'],
    });
    return module?.classId ?? null;
  }
}
