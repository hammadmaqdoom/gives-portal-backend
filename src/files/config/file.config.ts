import { registerAs } from '@nestjs/config';

import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { FileDriver, FileConfig } from './file-config.type';

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsEnum(FileDriver)
  FILE_DRIVER?: FileDriver;

  @ValidateIf((envValues) =>
    [
      FileDriver.S3,
      FileDriver.S3_PRESIGNED,
      FileDriver.B2,
      FileDriver.B2_PRESIGNED,
    ].includes(envValues.FILE_DRIVER),
  )
  @IsString()
  ACCESS_KEY_ID: string;

  @ValidateIf((envValues) =>
    [
      FileDriver.S3,
      FileDriver.S3_PRESIGNED,
      FileDriver.B2,
      FileDriver.B2_PRESIGNED,
    ].includes(envValues.FILE_DRIVER),
  )
  @IsString()
  SECRET_ACCESS_KEY: string;

  @ValidateIf((envValues) =>
    [
      FileDriver.S3,
      FileDriver.S3_PRESIGNED,
      FileDriver.B2,
      FileDriver.B2_PRESIGNED,
    ].includes(envValues.FILE_DRIVER),
  )
  @IsString()
  AWS_DEFAULT_S3_BUCKET: string;

  @ValidateIf((envValues) =>
    [FileDriver.S3, FileDriver.S3_PRESIGNED].includes(envValues.FILE_DRIVER),
  )
  @IsString()
  AWS_S3_REGION: string;

  @ValidateIf((envValues) =>
    [FileDriver.B2, FileDriver.B2_PRESIGNED].includes(envValues.FILE_DRIVER),
  )
  @IsString()
  B2_ENDPOINT_URL: string;

  @ValidateIf((envValues) =>
    [FileDriver.B2, FileDriver.B2_PRESIGNED].includes(envValues.FILE_DRIVER),
  )
  @IsString()
  B2_REGION: string;

  @ValidateIf(
    (envValues) => envValues.FILE_DRIVER === FileDriver.AZURE_BLOB_SAS,
  )
  @IsString()
  AZURE_STORAGE_ACCOUNT_NAME: string;

  @ValidateIf(
    (envValues) => envValues.FILE_DRIVER === FileDriver.AZURE_BLOB_SAS,
  )
  @IsString()
  AZURE_STORAGE_ACCOUNT_KEY: string;

  @ValidateIf(
    (envValues) => envValues.FILE_DRIVER === FileDriver.AZURE_BLOB_SAS,
  )
  @IsString()
  AZURE_CONTAINER_NAME: string;
}

export default registerAs<FileConfig>('file', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    driver:
      (process.env.FILE_DRIVER as FileDriver | undefined) ?? FileDriver.LOCAL,
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    awsDefaultS3Bucket: process.env.AWS_DEFAULT_S3_BUCKET,
    awsS3Region: process.env.AWS_S3_REGION,
    azureStorageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    azureStorageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    azureContainerName: process.env.AZURE_CONTAINER_NAME,
    azureBlobSasExpirySeconds: process.env.AZURE_BLOB_SAS_EXPIRY_SECONDS
      ? Number(process.env.AZURE_BLOB_SAS_EXPIRY_SECONDS)
      : undefined,
    azureBlobPublicBaseUrl: process.env.AZURE_BLOB_PUBLIC_BASE_URL,
    b2EndpointUrl: process.env.B2_ENDPOINT_URL,
    b2Region: process.env.B2_REGION,
    maxFileSize: 5242880, // 5mb
    maxVideoFileSize: 5368709120, // 5GB for video files
    videoChunkSize: 10485760, // 10MB per chunk
    enableChunkedUpload: true,
  };
});
