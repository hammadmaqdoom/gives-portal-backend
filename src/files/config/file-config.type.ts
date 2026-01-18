export enum FileDriver {
  LOCAL = 'local',
  S3 = 's3',
  S3_PRESIGNED = 's3-presigned',
  AZURE_BLOB_SAS = 'azure-blob-sas',
  B2 = 'b2',
  B2_PRESIGNED = 'b2-presigned',
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
  // Backblaze B2
  b2EndpointUrl?: string;
  b2Region?: string;
  maxFileSize: number;
  maxVideoFileSize?: number;
  videoChunkSize?: number;
  enableChunkedUpload?: boolean;
};
