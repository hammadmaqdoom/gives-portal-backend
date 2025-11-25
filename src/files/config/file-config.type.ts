export enum FileDriver {
  LOCAL = 'local',
  S3 = 's3',
  S3_PRESIGNED = 's3-presigned',
  AZURE_BLOB_SAS = 'azure-blob-sas',
}

export type FileConfig = {
  driver: FileDriver;
  // AWS (legacy)
  accessKeyId?: string;
  secretAccessKey?: string;
  awsDefaultS3Bucket?: string;
  awsS3Region?: string;
  // Azure
  azureStorageAccountName?: string;
  azureStorageAccountKey?: string;
  azureContainerName?: string;
  azureBlobSasExpirySeconds?: number;
  azureBlobPublicBaseUrl?: string;
  maxFileSize: number;
};
