import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Transform } from 'class-transformer';
import fileConfig from '../config/file.config';
import { FileConfig, FileDriver } from '../config/file-config.type';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfig } from '../../config/app-config.type';
import appConfig from '../../config/app.config';

export class File {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  url?: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  contextType: string;
  contextId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Type alias for backward compatibility
export type FileType = File;
