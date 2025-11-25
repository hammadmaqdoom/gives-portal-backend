import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileStorageToSettings1758800000000
  implements MigrationInterface
{
  name = 'AddFileStorageToSettings1758800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns if not already present
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "fileDriver" varchar(32) DEFAULT 'local',
      ADD COLUMN IF NOT EXISTS "accessKeyId" varchar(255),
      ADD COLUMN IF NOT EXISTS "secretAccessKey" varchar(255),
      ADD COLUMN IF NOT EXISTS "awsDefaultS3Bucket" varchar(255),
      ADD COLUMN IF NOT EXISTS "awsS3Region" varchar(100),
      ADD COLUMN IF NOT EXISTS "azureStorageAccountName" varchar(255),
      ADD COLUMN IF NOT EXISTS "azureStorageAccountKey" varchar(255),
      ADD COLUMN IF NOT EXISTS "azureContainerName" varchar(255),
      ADD COLUMN IF NOT EXISTS "azureBlobSasExpirySeconds" integer,
      ADD COLUMN IF NOT EXISTS "azureBlobPublicBaseUrl" varchar(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "settings"
      DROP COLUMN IF EXISTS "azureBlobPublicBaseUrl",
      DROP COLUMN IF EXISTS "azureBlobSasExpirySeconds",
      DROP COLUMN IF EXISTS "azureContainerName",
      DROP COLUMN IF EXISTS "azureStorageAccountKey",
      DROP COLUMN IF EXISTS "azureStorageAccountName",
      DROP COLUMN IF EXISTS "awsS3Region",
      DROP COLUMN IF EXISTS "awsDefaultS3Bucket",
      DROP COLUMN IF EXISTS "secretAccessKey",
      DROP COLUMN IF EXISTS "accessKeyId",
      DROP COLUMN IF EXISTS "fileDriver"
    `);
  }
}
