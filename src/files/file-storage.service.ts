import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileDriver } from './config/file-config.type';
import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadContext {
  type: 'assignment' | 'submission' | 'module';
  id: string | number;
  userId: string | number;
}

export interface UploadedFileInfo {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedBy: string | number;
  uploadedAt: Date;
  contextType: string;
  contextId: string | number;
}

@Injectable()
export class FileStorageService {
  private readonly s3Client: S3Client;
  private readonly fileDriver: FileDriver;
  private readonly uploadBasePath: string;
  private readonly s3Bucket: string;
  private readonly s3Region: string;

  constructor(private readonly configService: ConfigService) {
    this.fileDriver =
      this.configService.get<FileDriver>('file.driver') || FileDriver.LOCAL;
    this.uploadBasePath =
      this.configService.get('file.uploadBasePath') || 'uploads';

    if (
      this.fileDriver === FileDriver.S3 ||
      this.fileDriver === FileDriver.S3_PRESIGNED
    ) {
      const region = this.configService.get('file.awsS3Region');
      const accessKeyId = this.configService.get('file.accessKeyId');
      const secretAccessKey = this.configService.get('file.secretAccessKey');
      const bucket = this.configService.get('file.awsDefaultS3Bucket');

      if (region && accessKeyId && secretAccessKey && bucket) {
        this.s3Client = new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.s3Bucket = bucket;
        this.s3Region = region;
      }
    }
  }

  /**
   * Upload a file with context awareness
   */
  async uploadFileWithContext(
    file: Express.Multer.File,
    context: FileUploadContext,
  ): Promise<UploadedFileInfo> {
    // Validate file
    this.validateFile(file, context.type);

    // Generate unique filename
    const uniqueFilename = this.generateUniqueFilename(file.originalname);

    // Create context folder path
    const contextFolderPath = this.createContextFolderPath(
      context.type,
      context.id,
    );

    // Ensure folder exists
    await this.ensureFolderExists(contextFolderPath);

    // Upload file
    const filePath = await this.uploadFile(
      file,
      contextFolderPath,
      uniqueFilename,
    );

    // Return file info
    return {
      id: uuidv4(),
      filename: uniqueFilename,
      originalName: file.originalname,
      path: filePath,
      size: file.size,
      mimeType: file.mimetype,
      uploadedBy: context.userId,
      uploadedAt: new Date(),
      contextType: context.type,
      contextId: context.id,
    };
  }

  /**
   * Upload multiple files with context
   */
  async uploadMultipleFilesWithContext(
    files: Express.Multer.File[],
    context: FileUploadContext,
  ): Promise<UploadedFileInfo[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFileWithContext(file, context),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Create context folder path
   */
  private createContextFolderPath(
    contextType: string,
    contextId: string | number,
  ): string {
    return path.join(this.uploadBasePath, contextType, contextId.toString());
  }

  /**
   * Ensure folder exists (local or S3)
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    if (this.fileDriver === FileDriver.LOCAL) {
      await this.ensureLocalFolderExists(folderPath);
    } else if (
      this.fileDriver === FileDriver.S3 ||
      this.fileDriver === FileDriver.S3_PRESIGNED
    ) {
      await this.ensureS3FolderExists(folderPath);
    }
  }

  /**
   * Ensure local folder exists
   */
  private async ensureLocalFolderExists(folderPath: string): Promise<void> {
    const fullPath = path.resolve(folderPath);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  /**
   * Ensure S3 folder exists (create bucket if needed)
   */
  private async ensureS3FolderExists(folderPath: string): Promise<void> {
    try {
      // Check if bucket exists
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.s3Bucket }),
      );
    } catch (error) {
      // Bucket doesn't exist, create it
      await this.s3Client.send(
        new CreateBucketCommand({ Bucket: this.s3Bucket }),
      );
    }
  }

  /**
   * Upload file to storage
   */
  private async uploadFile(
    file: Express.Multer.File,
    folderPath: string,
    filename: string,
  ): Promise<string> {
    if (this.fileDriver === FileDriver.LOCAL) {
      return this.uploadToLocal(file, folderPath, filename);
    } else if (
      this.fileDriver === FileDriver.S3 ||
      this.fileDriver === FileDriver.S3_PRESIGNED
    ) {
      return this.uploadToS3(file, folderPath, filename);
    }

    throw new BadRequestException('Invalid file driver configuration');
  }

  /**
   * Upload file to local storage
   */
  private async uploadToLocal(
    file: Express.Multer.File,
    folderPath: string,
    filename: string,
  ): Promise<string> {
    const fullPath = path.resolve(folderPath, filename);
    const fullFolderPath = path.dirname(fullPath);

    // Ensure folder exists
    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, file.buffer);

    // Return relative path for database storage
    return path.join(folderPath, filename);
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    file: Express.Multer.File,
    folderPath: string,
    filename: string,
  ): Promise<string> {
    const s3Key = path.join(folderPath, filename).replace(/\\/g, '/');

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          size: file.size.toString(),
        },
      }),
    );

    // Return S3 key for database storage
    return s3Key;
  }

  /**
   * Generate unique filename
   */
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');

    return `${timestamp}_${sanitizedName}${extension}`;
  }

  /**
   * Validate file based on context
   */
  private validateFile(file: Express.Multer.File, contextType: string): void {
    // Check file size
    const maxSize = this.configService.get('file.maxFileSize') || 5242880; // 5MB default
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    // Check file type based on context
    const allowedExtensions = this.getAllowedExtensions(contextType);
    const fileExtension = path
      .extname(file.originalname)
      .toLowerCase()
      .substring(1);

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `File type .${fileExtension} is not allowed for ${contextType} uploads. Allowed types: ${allowedExtensions.join(', ')}`,
      );
    }
  }

  /**
   * Get allowed file extensions based on context
   */
  private getAllowedExtensions(contextType: string): string[] {
    switch (contextType) {
      case 'assignment':
        return [
          'pdf',
          'doc',
          'docx',
          'ppt',
          'pptx',
          'txt',
          'jpg',
          'jpeg',
          'png',
          'gif',
          'zip',
          'rar',
        ];
      case 'submission':
        return [
          'pdf',
          'doc',
          'docx',
          'ppt',
          'pptx',
          'txt',
          'jpg',
          'jpeg',
          'png',
          'gif',
          'zip',
          'rar',
        ];
      case 'module':
        return [
          'pdf',
          'doc',
          'docx',
          'ppt',
          'pptx',
          'txt',
          'jpg',
          'jpeg',
          'png',
          'gif',
          'mp4',
          'avi',
          'mov',
          'zip',
          'rar',
        ];
      default:
        return ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'];
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    if (this.fileDriver === FileDriver.LOCAL) {
      await this.deleteFromLocal(filePath);
    } else if (
      this.fileDriver === FileDriver.S3 ||
      this.fileDriver === FileDriver.S3_PRESIGNED
    ) {
      await this.deleteFromS3(filePath);
    }
  }

  /**
   * Delete file from local storage
   */
  private async deleteFromLocal(filePath: string): Promise<void> {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  /**
   * Delete file from S3
   */
  private async deleteFromS3(filePath: string): Promise<void> {
    // Implementation for S3 deletion
    // This would use DeleteObjectCommand from AWS SDK
  }

  /**
   * Get file URL for access
   */
  getFileUrl(filePath: string): string {
    if (this.fileDriver === FileDriver.LOCAL) {
      // For local files, return relative path
      return filePath;
    } else if (
      this.fileDriver === FileDriver.S3 ||
      this.fileDriver === FileDriver.S3_PRESIGNED
    ) {
      // For S3 files, construct the full S3 URL
      return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${filePath}`;
    }

    return filePath;
  }
}
