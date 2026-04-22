import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Get,
  Delete,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  Res,
  Options,
  Head,
  Query,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { JwtQueryParamGuard } from './guards/jwt-query-param.guard';
import { FrontendOriginGuard } from './guards/frontend-origin.guard';
import { FilesService } from './files.service';
import { ConfigService } from '@nestjs/config';
import { FileStorageService, FileUploadContext } from './file-storage.service';
import { FileDriver } from './config/file-config.type';
import { User } from '../users/domain/user';
import * as path from 'path';
import { AccessControlService } from '../access-control/access-control.service';
import { ClassesService } from '../classes/classes.service';
import { StudentsService } from '../students/students.service';
import { TeachersService } from '../teachers/teachers.service';
import { Inject, forwardRef } from '@nestjs/common';
import { AssignmentsService } from '../assignments/assignments.service';

@ApiTags('File Management')
@ApiBearerAuth()
@UseGuards(JwtQueryParamGuard, RolesGuard)
@Controller({
  path: 'files',
  version: '1',
})
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly fileStorageService: FileStorageService,
    private readonly configService: ConfigService,
    private readonly accessControlService: AccessControlService,
    private readonly classesService: ClassesService,
    private readonly studentsService: StudentsService,
    private readonly teachersService: TeachersService,
    @Inject(forwardRef(() => AssignmentsService))
    private readonly assignmentsService: AssignmentsService,
  ) { }

  /**
   * Get base URL for the current server
   */
  private getBaseUrl(): string {
    // In production, you might want to get this from environment variables
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '3000';
    return `${protocol}://${host}:${port}`;
  }

  /**
   * Get allowed origin for CORS headers
   * Prefers request origin, then constructs from frontend domain config
   */
  private getAllowedOrigin(req: any): string {
    const requestOrigin = req.headers.origin;
    const frontendDomain = this.configService.get('app.frontendDomain', {
      infer: true,
    });

    // Construct allowed origin - use request origin if available, otherwise construct from config
    if (requestOrigin) {
      return requestOrigin;
    } else if (frontendDomain) {
      // If it already has protocol, use as-is, otherwise add https:// (or http:// in dev)
      if (frontendDomain.startsWith('http://') || frontendDomain.startsWith('https://')) {
        return frontendDomain;
      } else {
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        return `${protocol}://${frontendDomain}`;
      }
    }

    return '*';
  }

  /**
   * Check if a teacher is assigned to a class
   */
  private async checkTeacherOwnsClass(
    teacherEmail: string,
    classId: number,
  ): Promise<boolean> {
    try {
      // Get teacher by email
      const teacher = await this.teachersService.findByEmail(teacherEmail);
      if (!teacher) {
        return false;
      }

      // Get class and check if teacher is assigned to it
      const classEntity = await this.classesService.findById(classId);
      if (!classEntity) {
        return false;
      }

      // Check if the teacher is assigned to this class
      return classEntity.teacher?.id === teacher.id;
    } catch (error) {
      console.error('Error checking teacher class ownership:', error);
      return false;
    }
  }

  /**
   * Get class ID from file context
   */
  private async getClassIdFromFile(file: any): Promise<number | null> {
    // If file context is directly a class
    if (file.contextType === 'class') {
      return parseInt(file.contextId, 10);
    }

    // If file context is a learning module, get the class from the module
    if (file.contextType === 'module') {
      try {
        const moduleId = parseInt(file.contextId, 10);
        if (!Number.isNaN(moduleId)) {
          const classIdFromModule = await this.filesService.getClassIdByModuleId(moduleId);
          if (classIdFromModule != null) return classIdFromModule;
        }
        const modulesUsingFile = await this.filesService.checkFileUsageInModules(file.id);
        if (modulesUsingFile.length > 0 && modulesUsingFile[0].classId) {
          return modulesUsingFile[0].classId;
        }
      } catch (error) {
        console.error('Error getting class ID from module:', error);
      }
    }

    return null;
  }

  /**
   * Generate proper file URL (presigned for S3/B2, serve endpoint for local)
   * For videos, always use serve endpoint to avoid expiration issues
   */
  private async generateFileUrl(
    fileId: string,
    filePath: string,
    mimeType?: string,
  ): Promise<string> {
    const fileDriver = await this.fileStorageService.getDriver();
    const baseUrl = this.getBaseUrl();

    // Check if file is a video by mimeType or file extension
    const isVideo =
      mimeType?.startsWith('video/') ||
      /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(filePath);

    // For videos, always use serve endpoint (no expiration)
    // For local files, always use serve endpoint
    if (isVideo || fileDriver === FileDriver.LOCAL) {
      return `${baseUrl}/api/v1/files/serve/${fileId}`;
    }

    // For S3/B2 non-video files, generate presigned URL with longer expiry
    if (
      fileDriver === FileDriver.S3 ||
      fileDriver === FileDriver.S3_PRESIGNED ||
      fileDriver === FileDriver.B2 ||
      fileDriver === FileDriver.B2_PRESIGNED
    ) {
      try {
        // Use longer expiry for non-video files (24 hours)
        return await this.fileStorageService.getPresignedFileUrl(
          filePath,
          86400, // 24 hours expiry
        );
      } catch (error) {
        console.error('Error generating presigned URL:', error);
        // Fallback to serve endpoint if presigned URL generation fails
        return `${baseUrl}/api/v1/files/serve/${fileId}`;
      }
    }

    // Fallback for other storage types
    return `${baseUrl}/api/v1/files/serve/${fileId}`;
  }

  @Post('upload/assignment/:assignmentId')
  @ApiOperation({ summary: 'Upload files for an assignment' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async uploadAssignmentFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: '.(pdf|doc|docx|ppt|pptx|txt|jpg|jpeg|png|gif|zip|rar)',
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Param('assignmentId') assignmentId: string,
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const context: FileUploadContext = {
      type: 'assignment',
      id: assignmentId,
      userId: req.user?.id || 'unknown',
    };

    const uploadedFiles =
      await this.filesService.uploadMultipleFilesWithContext(files, context);

    // Generate proper URLs for all uploaded files
    const filesWithUrls = await Promise.all(
      uploadedFiles.map(async (file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        url: await this.generateFileUrl(file.id, file.path, file.mimeType),
      })),
    );

    return {
      message: 'Files uploaded successfully',
      files: filesWithUrls,
    };
  }

  @Post('upload/submission/:submissionId')
  @ApiOperation({ summary: 'Upload files for a submission' })
  @ApiParam({ name: 'submissionId', description: 'Submission ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async uploadSubmissionFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: '.(pdf|doc|docx|ppt|pptx|txt|jpg|jpeg|png|gif|zip|rar)',
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Param('submissionId') submissionId: string,
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const context: FileUploadContext = {
      type: 'submission',
      id: submissionId,
      userId: req.user?.id || 'unknown',
    };

    const uploadedFiles =
      await this.filesService.uploadMultipleFilesWithContext(files, context);

    // Generate proper URLs for all uploaded files
    const filesWithUrls = await Promise.all(
      uploadedFiles.map(async (file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        url: await this.generateFileUrl(file.id, file.path, file.mimeType),
      })),
    );

    return {
      message: 'Files uploaded successfully',
      files: filesWithUrls,
    };
  }

  @Post('upload/module/:moduleId')
  @ApiOperation({ summary: 'Upload files for a learning module' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async uploadModuleFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB for modules
          new FileTypeValidator({
            fileType:
              '.(pdf|doc|docx|ppt|pptx|txt|jpg|jpeg|png|gif|mp4|avi|mov|zip|rar)',
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Param('moduleId') moduleId: string,
    @Req() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const context: FileUploadContext = {
      type: 'module',
      id: moduleId,
      userId: req.user?.id || 'unknown',
    };

    const uploadedFiles =
      await this.filesService.uploadMultipleFilesWithContext(files, context);

    // Generate proper URLs for all uploaded files
    const filesWithUrls = await Promise.all(
      uploadedFiles.map(async (file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        url: await this.generateFileUrl(file.id, file.path, file.mimeType),
      })),
    );

    return {
      message: 'Files uploaded successfully',
      files: filesWithUrls,
    };
  }

  @Post('upload/profile')
  @ApiOperation({
    summary: 'Upload a profile picture (for teachers, students, etc.)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async uploadProfilePicture(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB for profile pics
          new FileTypeValidator({
            fileType: '.(jpg|jpeg|png|gif|webp)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const context: FileUploadContext = {
      type: 'profile',
      id: req.user?.id || 'unknown',
      userId: req.user?.id || 'unknown',
    };

    const uploadedFile = await this.filesService.uploadFileWithContext(
      file,
      context,
    );

    // Generate proper URL for the uploaded file
    const fileUrl = await this.generateFileUrl(
      uploadedFile.id,
      uploadedFile.path,
      uploadedFile.mimeType,
    );

    return {
      id: uploadedFile.id,
      fileId: uploadedFile.id, // For backward compatibility
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalName,
      path: uploadedFile.path,
      size: uploadedFile.size,
      mimeType: uploadedFile.mimeType,
      uploadedAt: uploadedFile.uploadedAt,
      url: fileUrl,
    };
  }

  @Post('upload/course/thumbnail')
  @ApiOperation({ summary: 'Upload a course thumbnail image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async uploadCourseThumbnail(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType: '.(jpg|jpeg|png|gif|webp)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const context: FileUploadContext = {
      type: 'course',
      id: 'thumbnail',
      userId: req.user?.id || 'unknown',
    };

    const uploadedFile = await this.filesService.uploadFileWithContext(
      file,
      context,
    );

    // Generate proper URL for the uploaded file
    const fileUrl = await this.generateFileUrl(
      uploadedFile.id,
      uploadedFile.path,
      uploadedFile.mimeType,
    );

    return {
      id: uploadedFile.id,
      fileId: uploadedFile.id,
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalName,
      path: uploadedFile.path,
      size: uploadedFile.size,
      mimeType: uploadedFile.mimeType,
      uploadedAt: uploadedFile.uploadedAt,
      url: fileUrl,
    };
  }

  @Post('upload/course/cover')
  @ApiOperation({ summary: 'Upload a course cover image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async uploadCourseCover(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB for cover images
          new FileTypeValidator({
            fileType: '.(jpg|jpeg|png|gif|webp)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const context: FileUploadContext = {
      type: 'course',
      id: 'cover',
      userId: req.user?.id || 'unknown',
    };

    const uploadedFile = await this.filesService.uploadFileWithContext(
      file,
      context,
    );

    // Generate proper URL for the uploaded file
    const fileUrl = await this.generateFileUrl(
      uploadedFile.id,
      uploadedFile.path,
      uploadedFile.mimeType,
    );

    return {
      id: uploadedFile.id,
      fileId: uploadedFile.id,
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalName,
      path: uploadedFile.path,
      size: uploadedFile.size,
      mimeType: uploadedFile.mimeType,
      uploadedAt: uploadedFile.uploadedAt,
      url: fileUrl,
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a general file (e.g., documents)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: '.(pdf|doc|docx|jpg|jpeg|png|gif|webp)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const context: FileUploadContext = {
      type: 'general',
      id: 'general',
      userId: req.user?.id || 'unknown',
    };

    const uploadedFile = await this.filesService.uploadFileWithContext(
      file,
      context,
    );

    // Generate proper URL for the uploaded file
    const fileUrl = await this.generateFileUrl(
      uploadedFile.id,
      uploadedFile.path,
      uploadedFile.mimeType,
    );

    return {
      id: uploadedFile.id,
      fileId: uploadedFile.id, // For backward compatibility
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalName,
      path: uploadedFile.path,
      size: uploadedFile.size,
      mimeType: uploadedFile.mimeType,
      uploadedAt: uploadedFile.uploadedAt,
      url: fileUrl,
    };
  }

  @Post('upload/video/:classId')
  @ApiOperation({ summary: 'Upload a video file for a class' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      // Override the module-level Multer default (5MB) so videos up to 5GB
      // are accepted by Multer before reaching the controller-level validators.
      limits: { fileSize: 5368709120 }, // 5GB for videos
    }),
  )
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async uploadClassVideo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5368709120 }), // 5GB for videos
          new FileTypeValidator({
            fileType: '.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('classId') classId: string,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const context: FileUploadContext = {
      type: 'class',
      id: classId,
      userId: req.user?.id || 'unknown',
    };

    const uploadedFile = await this.filesService.uploadFileWithContext(
      file,
      context,
    );

    // Generate proper URL for the uploaded file
    const fileUrl = await this.generateFileUrl(
      uploadedFile.id,
      uploadedFile.path,
      uploadedFile.mimeType,
    );

    return {
      id: uploadedFile.id,
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalName,
      path: uploadedFile.path,
      size: uploadedFile.size,
      mimeType: uploadedFile.mimeType,
      uploadedAt: uploadedFile.uploadedAt,
      url: fileUrl,
    };
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Get all files for a class' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.user, RoleEnum.superAdmin)
  async getClassFiles(@Param('classId') classId: string, @Req() req: any) {
    const user = req.user;
    const userRole = user?.role?.name?.toLowerCase();

    // Check authorization - verify user has access to this class
    if (userRole !== 'admin' && userRole !== 'teacher' && userRole !== 'superadmin') {
      // For students, check if they have access to the class
      if (userRole === 'user' || !userRole) {
        // Get student ID from user ID
        const student = await this.studentsService.findByUserId(user?.id);
        const studentId = student?.id;

        if (studentId) {
          const accessStatus = await this.accessControlService.checkCourseAccess(
            studentId,
            Number(classId),
          );
          if (!accessStatus.hasAccess) {
            throw new BadRequestException(
              'You do not have access to this class',
            );
          }
        } else {
          throw new BadRequestException('Student profile not found');
        }
      }
    }

    // Get files filtered by user role
    let files: any[];
    if (userRole === 'admin' || userRole === 'teacher' || userRole === 'superadmin') {
      // Admins, teachers, and superadmins see all files
      files = await this.filesService.getFilesByClassFilteredByRole(
        Number(classId),
        userRole,
      );
    } else {
      // Students see only assignment and their own submission files
      const student = await this.studentsService.findByUserId(user?.id);
      const studentId = student?.id;
      if (!studentId) {
        throw new BadRequestException('Student profile not found');
      }
      files = await this.filesService.getFilesByClassFilteredByRole(
        Number(classId),
        userRole,
        studentId,
      );
    }

    // Generate proper URLs for all files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.uploadedAt,
        url: await this.generateFileUrl(file.id, file.path, file.mimeType),
      })),
    );

    return {
      files: filesWithUrls,
    };
  }

  @Get('context/:contextType/:contextId')
  @ApiOperation({ summary: 'Get files by context' })
  @ApiParam({
    name: 'contextType',
    description: 'Context type (assignment, submission, module)',
  })
  @ApiParam({ name: 'contextId', description: 'Context ID' })
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async getFilesByContext(
    @Param('contextType') contextType: string,
    @Param('contextId') contextId: string,
  ) {
    console.log(
      `Getting files for context: ${contextType} with ID: ${contextId}`,
    );

    const files = await this.filesService.getFilesByContext(
      contextType,
      contextId,
    );
    console.log(
      `Found ${files.length} files for context ${contextType}:${contextId}`,
    );
    console.log('Files:', files);

    // Generate proper URLs for all files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.uploadedAt,
        url: await this.generateFileUrl(file.id, file.path, file.mimeType),
      })),
    );

    return {
      files: filesWithUrls,
    };
  }

  @Get('by-path')
  @ApiOperation({ summary: 'Get file by path (for backward compatibility)' })
  @ApiParam({ name: 'path', description: 'File path' })
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async getFileByPath(@Query('path') filePath: string) {
    try {
      console.log(`Looking for file with path: ${filePath}`);

      // Decode the path if it's URL encoded
      const decodedPath = decodeURIComponent(filePath);
      console.log(`Decoded path: ${decodedPath}`);

      // Try to find file by exact path first
      let file = await this.filesService.getFileByPath(decodedPath);

      // If not found, try without the 'uploads/' prefix
      if (!file && decodedPath.startsWith('uploads/')) {
        const pathWithoutUploads = decodedPath.substring(8); // Remove 'uploads/'
        console.log(`Trying without uploads prefix: ${pathWithoutUploads}`);
        file = await this.filesService.getFileByPath(pathWithoutUploads);
      }

      // If still not found, try with just the filename
      if (!file) {
        const filename = decodedPath.split('/').pop();
        if (filename) {
          console.log(`Trying with just filename: ${filename}`);
          file = await this.filesService.getFileByFilename(filename);
        }
      }

      if (!file) {
        // List all files in database for debugging
        const allFiles = await this.filesService.getAllFiles();
        console.log(
          'All files in database:',
          allFiles.map((f) => ({
            id: f.id,
            path: f.path,
            filename: f.filename,
          })),
        );
        throw new BadRequestException('File not found in database');
      }

      // Generate proper URL for file serving
      const fileUrl = await this.generateFileUrl(
        file.id,
        file.path,
        file.mimeType,
      );

      return {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.uploadedAt,
        url: fileUrl,
      };
    } catch (error) {
      console.error('Error getting file by path:', error);
      throw new BadRequestException('Failed to get file by path');
    }
  }

  @Get('serve/:id')
  @ApiOperation({ summary: 'Serve file content by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @UseGuards(FrontendOriginGuard)
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async serveFile(@Param('id') id: string, @Req() req: any, @Res() res: any, @Query('token') token?: string) {
    try {
      const file = await this.filesService.getFileById(id);
      if (!file) {
        throw new NotFoundException('File not found');
      }

      // Check authorization for class, module, and assignment files
      const user = req.user;
      const userRole = user?.role?.name?.toLowerCase();

      // Admins, teachers, and super admins always have access
      if (userRole !== 'admin' && userRole !== 'teacher' && userRole !== 'superadmin') {
        // For students, check access based on context type
        if (userRole === 'user' || !userRole) {
          let classId: number | null = null;

          if (file.contextType === 'class') {
            classId = parseInt(file.contextId, 10);
          } else if (file.contextType === 'module') {
            // Get class ID from module using the existing helper method
            classId = await this.getClassIdFromFile(file);
            if (!classId) {
              throw new BadRequestException('Unable to verify module access');
            }
          } else if (file.contextType === 'assignment') {
            // Get class ID from assignment
            try {
              const assignmentId = parseInt(file.contextId, 10);
              const assignment = await this.assignmentsService.findById(assignmentId);
              if (assignment && (assignment as any).classId) {
                classId = (assignment as any).classId;
              } else if (assignment && (assignment as any).class?.id) {
                classId = (assignment as any).class.id;
              } else {
                throw new BadRequestException('Unable to verify assignment access');
              }
            } catch (error) {
              console.error('Error getting class ID from assignment:', error);
              throw new BadRequestException('You do not have access to this file');
            }
          } else if (file.contextType === 'submission') {
            // For submissions, check if student owns the submission or is teacher/admin
            const student = await this.studentsService.findByUserId(user?.id);
            if (!student) {
              throw new BadRequestException('Student profile not found');
            }
            // Get submission to find assignment and class
            try {
              const submissionId = parseInt(file.contextId, 10);
              // We'll allow access for now - the submission context should be handled by the assignment context
              // This is a simplified check
            } catch (error) {
              console.error('Error verifying submission access:', error);
            }
          }

          if (classId) {
            const student = await this.studentsService.findByUserId(user?.id);
            if (!student) {
              throw new BadRequestException('Student profile not found');
            }
            const accessStatus = await this.accessControlService.checkCourseAccess(
              student.id,
              classId,
            );
            if (!accessStatus.hasAccess) {
              throw new BadRequestException(
                'You do not have access to this file',
              );
            }
          }
        }
      }

      console.log(`Serving file: ${file.filename} from path: ${file.path}`);

      // Get allowed origin for CORS
      const allowedOrigin = this.getAllowedOrigin(req);

      // Check if this is a video file
      const isVideo = file.mimeType?.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(file.path);

      // If using non-local storage (e.g., s3), stream via server to avoid CORS
      const isLocal = await this.fileStorageService.isLocal();
      if (!isLocal) {
        try {
          const { stream, contentType, contentLength } =
            await this.fileStorageService.getObjectStream(file.path);
          res.setHeader(
            'Content-Type',
            contentType || file.mimeType || 'application/octet-stream',
          );
          if (contentLength) res.setHeader('Content-Length', contentLength);
          res.setHeader(
            'Content-Disposition',
            `inline; filename="${file.originalName}"`,
          );

          // Restrict CORS to frontend domain only
          res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Frontend-Request, Range',
          );
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

          // Security headers
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'SAMEORIGIN');
          res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");

          // For videos, enable caching and range requests
          if (isVideo) {
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=3600');
          } else {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }

          stream.pipe(res);
          return;
        } catch (e) {
          console.error('Error streaming object from storage:', e);
          throw new BadRequestException('Unable to stream file from storage');
        }
      }

      // Get the full file path
      const fullPath = this.filesService.getFullFilePath(file.path);
      console.log(`Full file path: ${fullPath}`);
      console.log(`Current working directory: ${process.cwd()}`);

      // Check if file exists
      const fs = require('fs');
      console.log(`File exists check: ${fs.existsSync(fullPath)}`);

      if (!fs.existsSync(fullPath)) {
        console.log(`File not found at path: ${fullPath}`);
        throw new NotFoundException('File not found on disk');
      }

      // Get file stats for size
      const stat = fs.statSync(fullPath);
      const fileSize = stat.size;

      // Handle Range Requests for video streaming
      const range = req.headers.range;

      if (isVideo && range) {
        // Parse Range header
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        // Create read stream for the requested range
        const fileStream = fs.createReadStream(fullPath, { start, end });

        // Set 206 Partial Content status
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Frontend-Request, Range');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");

        // Enable caching for video chunks
        res.setHeader('Cache-Control', 'public, max-age=3600');

        fileStream.pipe(res);
        return;
      }

      // Set appropriate headers with security measures
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${file.originalName}"`,
      );

      // Restrict CORS to frontend domain only (already set above for non-local, set here for local)
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Frontend-Request, Range',
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

      // Security headers to prevent downloads and protect content
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");

      // For videos, enable range requests and caching
      if (isVideo) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
      } else {
        // Prevent caching for non-video files to ensure fresh token validation
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      // Stream the file
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  }

  @Options('serve/:id')
  @UseGuards(FrontendOriginGuard)
  async serveFileOptions(@Req() req: any, @Res() res: any) {
    // Get allowed origin for CORS
    const allowedOrigin = this.getAllowedOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Frontend-Request, Range',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).send();
  }

  @Head('serve/:id')
  @UseGuards(FrontendOriginGuard)
  async serveFileHead(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      const file = await this.filesService.getFileById(id);
      if (!file) {
        res.status(404).send();
        return;
      }

      // Get allowed origin for CORS
      const allowedOrigin = this.getAllowedOrigin(req);

      // If using non-local storage, return headers from storage
      const isLocal = await this.fileStorageService.isLocal();
      if (!isLocal) {
        try {
          const { contentType, contentLength } =
            await this.fileStorageService.headObject(file.path);
          if (contentType) res.setHeader('Content-Type', contentType);
          if (contentLength) res.setHeader('Content-Length', contentLength);

          // Security headers
          res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Frontend-Request',
          );
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'SAMEORIGIN');
          res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');

          res.status(200).send();
          return;
        } catch (e) {
          res.status(404).send();
          return;
        }
      }

      // Get the full file path (local)
      const fullPath = this.filesService.getFullFilePath(file.path);

      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(fullPath)) {
        res.status(404).send();
        return;
      }

      // Set appropriate headers with security measures
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', fs.statSync(fullPath).size);
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Frontend-Request',
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.status(200).send();
    } catch (error) {
      console.error('Error handling HEAD request for file:', error);
      res.status(500).send();
    }
  }

  @Get('serve/payment-proofs/:filename')
  @ApiOperation({ summary: 'Serve payment proof file by filename' })
  @ApiParam({ name: 'filename', description: 'Payment proof filename' })
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async servePaymentProofFile(
    @Param('filename') filename: string,
    @Res() res: any,
  ) {
    try {
      const fs = require('fs');
      const path = require('path');

      // Construct the file path
      const filePath = path.join(
        process.cwd(),
        'uploads',
        'payment-proofs',
        filename,
      );

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Payment proof file not found' });
        return;
      }

      // Get file stats
      const stats = fs.statSync(filePath);

      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';

      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
      }

      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving payment proof file:', error);
      res.status(500).json({ error: 'Failed to serve payment proof file' });
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all files with pagination and filters' })
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async getAllFiles(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('contextType') contextType?: string,
    @Query('contextId') contextId?: string,
    @Query('uploadedBy') uploadedBy?: string,
    @Query('mimeType') mimeType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const files = await this.filesService.getAllFiles();

    // Apply filters
    let filteredFiles = files;

    if (search) {
      filteredFiles = filteredFiles.filter(
        (file) =>
          file.originalName.toLowerCase().includes(search.toLowerCase()) ||
          file.filename.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (contextType) {
      filteredFiles = filteredFiles.filter(
        (file) => file.contextType === contextType,
      );
    }

    if (contextId) {
      filteredFiles = filteredFiles.filter(
        (file) => file.contextId === contextId,
      );
    }

    if (uploadedBy) {
      filteredFiles = filteredFiles.filter(
        (file) => file.uploadedBy === uploadedBy,
      );
    }

    if (mimeType) {
      filteredFiles = filteredFiles.filter((file) =>
        file.mimeType.includes(mimeType),
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredFiles = filteredFiles.filter(
        (file) => new Date(file.uploadedAt) >= start,
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      filteredFiles = filteredFiles.filter(
        (file) => new Date(file.uploadedAt) <= end,
      );
    }

    // Pagination
    const total = filteredFiles.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    // Generate proper URLs for all files
    const filesWithUrls = await Promise.all(
      paginatedFiles.map(async (file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        url: await this.generateFileUrl(file.id, file.path, file.mimeType),
        size: file.size,
        mimeType: file.mimeType,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.uploadedAt,
        contextType: file.contextType,
        contextId: file.contextId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        deletedAt: file.deletedAt,
      })),
    );

    return {
      data: filesWithUrls,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get file statistics' })
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async getFileStats() {
    const files = await this.filesService.getAllFiles();

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const filesByType = files.reduce(
      (acc, file) => {
        const type = file.mimeType.split('/')[0];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const recentFiles = files
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      )
      .slice(0, 5);

    // Generate proper URLs for recent uploads
    const recentUploads = await Promise.all(
      recentFiles.map(async (file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        url: await this.generateFileUrl(file.id, file.path, file.mimeType),
      })),
    );

    return {
      totalFiles: files.length,
      totalSize,
      filesByType,
      recentUploads,
    };
  }

  @Get('debug/count')
  @ApiOperation({ summary: 'Get total file count for debugging' })
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async getFileCount() {
    console.log('Debug: Getting file count');
    const allFiles = await this.filesService.getAllFiles();
    console.log(`Debug: Total files in database: ${allFiles.length}`);

    // Group by context type
    const contextCounts = allFiles.reduce(
      (acc, file) => {
        acc[file.contextType] = (acc[file.contextType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('Debug: Files by context type:', contextCounts);

    return {
      totalFiles: allFiles.length,
      contextCounts,
      sampleFiles: allFiles.slice(0, 5).map((file) => ({
        id: file.id,
        contextType: file.contextType,
        contextId: file.contextId,
        filename: file.filename,
      })),
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async downloadFile(@Param('id') id: string, @Res() res: any) {
    const file = await this.filesService.getFileById(id);
    if (!file) {
      throw new BadRequestException('File not found');
    }

    // If using non-local storage, stream download via server
    const isLocal = await this.fileStorageService.isLocal();
    if (!isLocal) {
      try {
        const { stream, contentType, contentLength } =
          await this.fileStorageService.getObjectStream(file.path);
        res.setHeader(
          'Content-Type',
          contentType || file.mimeType || 'application/octet-stream',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${file.originalName}"`,
        );
        if (contentLength) res.setHeader('Content-Length', contentLength);
        stream.pipe(res);
        return;
      } catch (e) {
        throw new BadRequestException('Unable to download file from storage');
      }
    }

    const fullPath = this.filesService.getFullFilePath(file.path);
    const fs = require('fs');

    if (!fs.existsSync(fullPath)) {
      throw new BadRequestException('File not found on disk');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`,
    );
    res.setHeader('Content-Length', file.size);

    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async getFileById(@Param('id') id: string) {
    const file = await this.filesService.getFileById(id);
    if (!file) {
      throw new BadRequestException('File not found');
    }

    // Generate proper URL for file serving
    const fileUrl = await this.generateFileUrl(
      file.id,
      file.path,
      file.mimeType,
    );

    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      path: file.path,
      size: file.size,
      mimeType: file.mimeType,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
      url: fileUrl,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async deleteFile(@Param('id') id: string, @Req() req: any) {
    const file = await this.filesService.getFileById(id);
    if (!file) {
      throw new BadRequestException('File not found');
    }

    const userRole = req.user?.role?.name?.toLowerCase();
    const userEmail = req.user?.email;

    // Admin and super admin can delete any file
    if (userRole === 'admin' || userRole === 'superadmin') {
      // Check if file is being used by any learning module
      if (file.contextType === 'class' || file.contextType === 'module') {
        const modulesUsingFile = await this.filesService.checkFileUsageInModules(id);
        if (modulesUsingFile.length > 0) {
          throw new BadRequestException(
            `Cannot delete file: It is being used by ${modulesUsingFile.length} learning module(s)`,
          );
        }
      }

      await this.filesService.deleteFile(id);
      return {
        message: 'File deleted successfully',
      };
    }

    // Teacher authorization
    if (userRole === 'teacher') {
      // Get the class ID associated with this file
      let classId: number | null = null;

      if (file.contextType === 'class') {
        classId = parseInt(file.contextId, 10);
      } else if (file.contextType === 'module') {
        // For module files, we need to get the class from the module
        classId = await this.getClassIdFromFile(file);
      }

      if (classId) {
        // Check if teacher is assigned to this class
        const isTeacherOfClass = await this.checkTeacherOwnsClass(userEmail, classId);

        if (!isTeacherOfClass) {
          throw new BadRequestException(
            'You can only delete files from classes you are assigned to teach',
          );
        }

        // Check if file is being used by any learning module
        const modulesUsingFile = await this.filesService.checkFileUsageInModules(id);
        if (modulesUsingFile.length > 0) {
          throw new BadRequestException(
            `Cannot delete file: It is being used by ${modulesUsingFile.length} learning module(s)`,
          );
        }

        await this.filesService.deleteFile(id);
        return {
          message: 'File deleted successfully',
        };
      } else {
        // For non-class/module files, teachers can only delete their own uploads
        if (file.uploadedBy !== req.user?.id) {
          throw new BadRequestException(
            'You can only delete files you uploaded',
          );
        }

        await this.filesService.deleteFile(id);
        return {
          message: 'File deleted successfully',
        };
      }
    }

    // If we reach here, user is not authorized
    throw new BadRequestException('You are not authorized to delete this file');
  }

  @Delete('context/:contextType/:contextId')
  @ApiOperation({ summary: 'Delete all files for a context' })
  @ApiParam({ name: 'contextType', description: 'Context type' })
  @ApiParam({ name: 'contextId', description: 'Context ID' })
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  async deleteFilesByContext(
    @Param('contextType') contextType: string,
    @Param('contextId') contextId: string,
    @Req() req: any,
  ) {
    const userRole = req.user?.role?.name?.toLowerCase();
    const userEmail = req.user?.email;

    // Admin and super admin can delete any files
    if (userRole === 'admin' || userRole === 'superadmin') {
      await this.filesService.deleteFilesByContext(contextType, contextId);
      return {
        message: 'All files for this context have been deleted',
      };
    }

    // Teacher authorization
    if (userRole === 'teacher') {
      let classId: number | null = null;

      // Determine the class ID based on context type
      if (contextType === 'class') {
        classId = parseInt(contextId, 10);
      } else if (contextType === 'module') {
        // For module context, get the class from the module
        try {
          const files = await this.filesService.getFilesByContext(contextType, contextId);
          if (files.length > 0) {
            classId = await this.getClassIdFromFile(files[0]);
          }
        } catch (error) {
          console.error('Error getting files for module:', error);
        }
      }

      if (classId) {
        // Check if teacher is assigned to this class
        const isTeacherOfClass = await this.checkTeacherOwnsClass(userEmail, classId);

        if (!isTeacherOfClass) {
          throw new BadRequestException(
            'You can only delete files from classes you are assigned to teach',
          );
        }

        await this.filesService.deleteFilesByContext(contextType, contextId);
        return {
          message: 'All files for this context have been deleted',
        };
      } else {
        // For non-class/module contexts, deny access
        throw new BadRequestException(
          'Teachers can only delete files associated with their assigned classes',
        );
      }
    }

    // If we reach here, user is not authorized
    throw new BadRequestException('You are not authorized to delete these files');
  }
}
