import {
  HttpStatus,
  Injectable,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';

import { FileUploadDto } from './dto/file.dto';
import {
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { FileType } from '../../../domain/file';
import { AllConfigType } from '../../../../config/config.type';
import { FileDriver } from '../../../config/file-config.type';
import { SettingsService } from '../../../../settings/settings.service';
@Injectable()
export class FilesS3PresignedService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly settingsService: SettingsService,
  ) {}

  async create(
    file: FileUploadDto,
  ): Promise<{ file: FileType; uploadSignedUrl: string }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    if (!file.fileName.match(/\.(jpg|jpeg|png|gif)$/i)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: `cantUploadFileType`,
        },
      });
    }

    if (
      file.fileSize >
      (this.configService.get('file.maxFileSize', {
        infer: true,
      }) || 0)
    ) {
      throw new PayloadTooLargeException({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: 'Payload Too Large',
        message: 'File too large',
      });
    }

    const fileExt = file.fileName.split('.').pop()?.toLowerCase();
    const randomBase = randomStringGenerator();
    const baseName = `${randomBase}.${fileExt}`;
    const prefixParts: string[] = [];
    if (file.contextType) {
      prefixParts.push(file.contextType);
    }
    if (file.contextId) {
      prefixParts.push(String(file.contextId));
    }
    const prefix = prefixParts.length > 0 ? `${prefixParts.join('/')}/` : '';
    const key = `${prefix}${baseName}`;
    
    // Get file storage settings from DB first, fallback to env
    let driver: FileDriver = this.configService.get('file.driver', { infer: true }) || FileDriver.LOCAL;
    let storageConfig: {
      fileDriver?: string | null;
      accessKeyId?: string | null;
      secretAccessKey?: string | null;
      awsDefaultS3Bucket?: string | null;
      awsS3Region?: string | null;
      azureStorageAccountName?: string | null;
      azureStorageAccountKey?: string | null;
      azureContainerName?: string | null;
      azureBlobSasExpirySeconds?: number | null;
      azureBlobPublicBaseUrl?: string | null;
    } | null = null;

    try {
      storageConfig = await this.settingsService.getFileStorage();
      if (storageConfig?.fileDriver) {
        driver = storageConfig.fileDriver as unknown as FileDriver;
      }
    } catch {
      // Fallback to env config if DB fetch fails
    }

    let signedUrl: string;
    if (driver === FileDriver.AZURE_BLOB_SAS) {
      const accountName =
        storageConfig?.azureStorageAccountName ||
        this.configService.getOrThrow('file.azureStorageAccountName', {
          infer: true,
        });
      const accountKey =
        storageConfig?.azureStorageAccountKey ||
        this.configService.getOrThrow('file.azureStorageAccountKey', {
          infer: true,
        });
      const containerName =
        storageConfig?.azureContainerName ||
        this.configService.getOrThrow('file.azureContainerName', {
          infer: true,
        });
      const expiresInSeconds =
        storageConfig?.azureBlobSasExpirySeconds ||
        this.configService.get('file.azureBlobSasExpirySeconds', {
          infer: true,
        }) ||
        3600;

      const sharedKeyCredential = new StorageSharedKeyCredential(
        accountName,
        accountKey,
      );

      const startsOn = new Date();
      const expiresOn = new Date(startsOn.getTime() + expiresInSeconds * 1000);
      const permissions = BlobSASPermissions.parse('cw');

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName,
          blobName: key,
          permissions,
          startsOn,
          expiresOn,
          protocol: SASProtocol.Https,
        },
        sharedKeyCredential,
      ).toString();

      const publicBaseUrl = storageConfig?.azureBlobPublicBaseUrl;
      if (publicBaseUrl) {
        signedUrl = `${publicBaseUrl}/${containerName}/${key}?${sasToken}`;
      } else {
        signedUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${key}?${sasToken}`;
      }
    } else {
      const region =
        storageConfig?.awsS3Region ||
        this.configService.get('file.awsS3Region', { infer: true });
      const accessKeyId =
        storageConfig?.accessKeyId ||
        this.configService.getOrThrow('file.accessKeyId', {
          infer: true,
        });
      const secretAccessKey =
        storageConfig?.secretAccessKey ||
        this.configService.getOrThrow('file.secretAccessKey', {
          infer: true,
        });
      const bucket =
        storageConfig?.awsDefaultS3Bucket ||
        this.configService.getOrThrow('file.awsDefaultS3Bucket', {
          infer: true,
        });

      const s3 = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentLength: file.fileSize,
      });
      signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    }
    const data = await this.fileRepository.create({
      filename: baseName,
      originalName: file.fileName,
      path: key,
      size: 0,
      mimeType: 'application/octet-stream',
      uploadedBy: 'system',
      uploadedAt: new Date(),
      contextType: file.contextType ?? 'generic',
      contextId: (file.contextId ?? '0').toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    });

    return {
      file: data,
      uploadSignedUrl: signedUrl,
    };
  }
}
