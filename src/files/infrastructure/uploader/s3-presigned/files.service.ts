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
@Injectable()
export class FilesS3PresignedService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService<AllConfigType>,
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
    const driver = this.configService.get('file.driver', { infer: true });
    let signedUrl: string;
    if (driver === FileDriver.AZURE_BLOB_SAS) {
      const accountName = this.configService.getOrThrow(
        'file.azureStorageAccountName',
        { infer: true },
      );
      const accountKey = this.configService.getOrThrow(
        'file.azureStorageAccountKey',
        { infer: true },
      );
      const containerName = this.configService.getOrThrow(
        'file.azureContainerName',
        { infer: true },
      );
      const expiresInSeconds =
        this.configService.get('file.azureBlobSasExpirySeconds', {
          infer: true,
        }) || 3600;

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

      signedUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${key}?${sasToken}`;
    } else {
      const s3 = new S3Client({
        region: this.configService.get('file.awsS3Region', { infer: true }),
        credentials: {
          accessKeyId: this.configService.getOrThrow('file.accessKeyId', {
            infer: true,
          }),
          secretAccessKey: this.configService.getOrThrow(
            'file.secretAccessKey',
            { infer: true },
          ),
        },
      });

      const command = new PutObjectCommand({
        Bucket: this.configService.getOrThrow('file.awsDefaultS3Bucket', {
          infer: true,
        }),
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
