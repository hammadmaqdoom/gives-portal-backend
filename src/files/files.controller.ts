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
import { FilesService } from './files.service';
import { FileStorageService, FileUploadContext } from './file-storage.service';
import { User } from '../users/domain/user';
import * as path from 'path';

@ApiTags('File Management')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'files',
  version: '1',
})
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly fileStorageService: FileStorageService,
  ) {}

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
  @Roles(RoleEnum.teacher, RoleEnum.admin)
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

    return {
      message: 'Files uploaded successfully',
      files: uploadedFiles.map((file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        url: file.url || this.filesService.getFileUrl(file), // Use stored URL or generate if missing
      })),
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
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin)
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

    return {
      message: 'Files uploaded successfully',
      files: uploadedFiles.map((file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        // Generate proper URL for file serving
        url: `${this.getBaseUrl()}/api/v1/files/serve/${file.id}`,
      })),
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
  @Roles(RoleEnum.teacher, RoleEnum.admin)
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

    return {
      message: 'Files uploaded successfully',
      files: uploadedFiles.map((file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        url: file.url || this.filesService.getFileUrl(file), // Use stored URL or generate if missing
      })),
    };
  }

  @Get('context/:contextType/:contextId')
  @ApiOperation({ summary: 'Get files by context' })
  @ApiParam({
    name: 'contextType',
    description: 'Context type (assignment, submission, module)',
  })
  @ApiParam({ name: 'contextId', description: 'Context ID' })
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

    return {
      files: files.map((file) => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.uploadedAt,
        // Generate proper URL for file serving
        url: `${this.getBaseUrl()}/api/v1/files/serve/${file.id}`,
      })),
    };
  }

  @Get('by-path')
  @ApiOperation({ summary: 'Get file by path (for backward compatibility)' })
  @ApiParam({ name: 'path', description: 'File path' })
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

      return {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        uploadedBy: file.uploadedBy,
        uploadedAt: file.uploadedAt,
        // Generate proper URL for file serving
        url: `${this.getBaseUrl()}/api/v1/files/serve/${file.id}`,
      };
    } catch (error) {
      console.error('Error getting file by path:', error);
      throw new BadRequestException('Failed to get file by path');
    }
  }

  @Get('serve/:id')
  @ApiOperation({ summary: 'Serve file content by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async serveFile(@Param('id') id: string, @Res() res: any) {
    try {
      const file = await this.filesService.getFileById(id);
      if (!file) {
        throw new BadRequestException('File not found');
      }

      console.log(`Serving file: ${file.filename} from path: ${file.path}`);

      // Get the full file path
      const fullPath = this.filesService.getFullFilePath(file.path);
      console.log(`Full file path: ${fullPath}`);
      console.log(`Current working directory: ${process.cwd()}`);

      // Check if file exists
      const fs = require('fs');
      console.log(`File exists check: ${fs.existsSync(fullPath)}`);

      if (!fs.existsSync(fullPath)) {
        console.log(`File not found at path: ${fullPath}`);
        // Try to list the directory contents
        const dirPath = path.dirname(fullPath);
        console.log(`Directory path: ${dirPath}`);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          console.log(`Directory contents: ${files}`);
        } else {
          console.log(`Directory does not exist: ${dirPath}`);
        }
        throw new BadRequestException('File not found on disk');
      }

      // Set appropriate headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${file.originalName}"`,
      );
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );

      // Stream the file
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  }

  @Options('serve/:id')
  async serveFileOptions(@Res() res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    res.status(200).send();
  }

  @Head('serve/:id')
  async serveFileHead(@Param('id') id: string, @Res() res: any) {
    try {
      const file = await this.filesService.getFileById(id);
      if (!file) {
        res.status(404).send();
        return;
      }

      // Get the full file path
      const fullPath = this.filesService.getFullFilePath(file.path);

      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(fullPath)) {
        res.status(404).send();
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', fs.statSync(fullPath).size);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );

      res.status(200).send();
    } catch (error) {
      console.error('Error handling HEAD request for file:', error);
      res.status(500).send();
    }
  }

  @Get('debug/count')
  @ApiOperation({ summary: 'Get total file count for debugging' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async getFileById(@Param('id') id: string) {
    const file = await this.filesService.getFileById(id);
    if (!file) {
      throw new BadRequestException('File not found');
    }

    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      path: file.path,
      size: file.size,
      mimeType: file.mimeType,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
      // Generate proper URL for file serving
      url: `${this.getBaseUrl()}/api/v1/files/serve/${file.id}`,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async deleteFile(@Param('id') id: string, @Req() req: any) {
    const file = await this.filesService.getFileById(id);
    if (!file) {
      throw new BadRequestException('File not found');
    }

    // Check if user can delete this file
    if (
      file.uploadedBy !== req.user?.id &&
      req.user?.role?.name !== RoleEnum.admin
    ) {
      throw new BadRequestException('You can only delete your own files');
    }

    await this.filesService.deleteFile(id);

    return {
      message: 'File deleted successfully',
    };
  }

  @Delete('context/:contextType/:contextId')
  @ApiOperation({ summary: 'Delete all files for a context' })
  @ApiParam({ name: 'contextType', description: 'Context type' })
  @ApiParam({ name: 'contextId', description: 'Context ID' })
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  async deleteFilesByContext(
    @Param('contextType') contextType: string,
    @Param('contextId') contextId: string,
  ) {
    await this.filesService.deleteFilesByContext(contextType, contextId);

    return {
      message: 'All files for this context have been deleted',
    };
  }
}
