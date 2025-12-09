import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingsTable1700000000000 implements MigrationInterface {
  name = 'CreateSettingsTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists using TypeORM's built-in method
    let tableExists = await queryRunner.hasTable('settings');

    // Try to create table if it doesn't exist
    if (!tableExists) {
      try {
        await queryRunner.query(`
          CREATE TABLE "settings" (
            "id" SERIAL NOT NULL,
            "appName" character varying(255) NOT NULL,
            "appTitle" character varying(255) NOT NULL,
            "metaDescription" text NOT NULL,
            "logoNavbar" text,
            "logoFavicon" text,
            "defaultTimezone" character varying(100) NOT NULL DEFAULT 'Asia/Karachi',
            "businessAddress" text,
            "taxRegistrationLabel" character varying(255),
            "taxRegistrationNumber" character varying(100),
            "companyNumber" character varying(100),
            "companyLegalName" character varying(255),
            "defaultCurrency" character varying(3) DEFAULT 'PKR',
            "bankName" character varying(255),
            "bankAccountNumber" character varying(100),
            "bankAccountTitle" character varying(100),
            "bankAccountType" character varying(50),
            "bankAccountCurrency" character varying(50),
            "bankRoutingNumber" character varying(100),
            "bankIban" character varying(100),
            "bankSwiftCode" character varying(100),
            "smtpHost" character varying(255),
            "smtpPort" integer,
            "smtpUser" character varying(255),
            "smtpPassword" character varying(255),
            "smtpFromEmail" character varying(255),
            "smtpFromName" character varying(255),
            "smtpSecure" boolean NOT NULL DEFAULT false,
            "smtpIgnoreTls" boolean NOT NULL DEFAULT false,
            "smtpRequireTls" boolean NOT NULL DEFAULT false,
            "contactPhone" character varying(20),
            "contactEmail" character varying(255),
            "contactWebsite" character varying(255),
            "socialFacebook" character varying(255),
            "socialTwitter" character varying(255),
            "socialLinkedin" character varying(255),
            "socialInstagram" character varying(255),
            "fileDriver" character varying(32) DEFAULT 'local',
            "accessKeyId" character varying(255),
            "secretAccessKey" character varying(255),
            "awsDefaultS3Bucket" character varying(255),
            "awsS3Region" character varying(100),
            "azureStorageAccountName" character varying(255),
            "azureStorageAccountKey" character varying(255),
            "azureContainerName" character varying(255),
            "azureBlobSasExpirySeconds" integer,
            "azureBlobPublicBaseUrl" character varying(500),
            "smsEnabled" boolean NOT NULL DEFAULT false,
            "smsProvider" character varying(100),
            "smsApiEmail" character varying(255),
            "smsApiKey" character varying(255),
            "smsMask" character varying(100),
            "smsApiUrl" character varying(500),
            "smsTestMode" boolean NOT NULL DEFAULT true,
            "whatsappEnabled" boolean NOT NULL DEFAULT false,
            "whatsappDeviceId" character varying(255),
            "whatsappApiUrl" character varying(500),
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_settings" PRIMARY KEY ("id")
          )
        `);
        tableExists = true; // Table was successfully created
      } catch (error: any) {
        // If table already exists (error code 42P07), that's okay - continue
        if (error?.code === '42P07') {
          // Table already exists, update flag and continue
          tableExists = true;
        } else {
          // Re-throw other errors
          throw error;
        }
      }
    }

    // If table exists (either existed before or was just created), ensure all columns exist
    if (tableExists) {
      // Get existing columns using SQL query
      const existingColumnsResult = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings'
      `);
      const existingColumns = existingColumnsResult.map((row: any) => row.column_name);

      // Helper function to check and add column
      const addColumnIfMissing = async (
        columnName: string,
        columnDefinition: string,
      ) => {
        if (!existingColumns.includes(columnName)) {
          try {
            await queryRunner.query(
              `ALTER TABLE "settings" ADD COLUMN ${columnDefinition}`,
            );
          } catch (error: any) {
            // Ignore error if column already exists (race condition)
            if (error?.code !== '42701') {
              throw error;
            }
          }
        }
      };

      // Add missing columns from original migration
      await addColumnIfMissing(
        'defaultCurrency',
        `"defaultCurrency" character varying(3) DEFAULT 'PKR'`,
      );

      // Add file storage columns
      await addColumnIfMissing(
        'fileDriver',
        `"fileDriver" character varying(32) DEFAULT 'local'`,
      );
      await addColumnIfMissing(
        'accessKeyId',
        `"accessKeyId" character varying(255)`,
      );
      await addColumnIfMissing(
        'secretAccessKey',
        `"secretAccessKey" character varying(255)`,
      );
      await addColumnIfMissing(
        'awsDefaultS3Bucket',
        `"awsDefaultS3Bucket" character varying(255)`,
      );
      await addColumnIfMissing(
        'awsS3Region',
        `"awsS3Region" character varying(100)`,
      );
      await addColumnIfMissing(
        'azureStorageAccountName',
        `"azureStorageAccountName" character varying(255)`,
      );
      await addColumnIfMissing(
        'azureStorageAccountKey',
        `"azureStorageAccountKey" character varying(255)`,
      );
      await addColumnIfMissing(
        'azureContainerName',
        `"azureContainerName" character varying(255)`,
      );
      await addColumnIfMissing(
        'azureBlobSasExpirySeconds',
        `"azureBlobSasExpirySeconds" integer`,
      );
      await addColumnIfMissing(
        'azureBlobPublicBaseUrl',
        `"azureBlobPublicBaseUrl" character varying(500)`,
      );

      // Add SMS configuration columns
      await addColumnIfMissing(
        'smsEnabled',
        `"smsEnabled" boolean NOT NULL DEFAULT false`,
      );
      await addColumnIfMissing(
        'smsProvider',
        `"smsProvider" character varying(100)`,
      );
      await addColumnIfMissing(
        'smsApiEmail',
        `"smsApiEmail" character varying(255)`,
      );
      await addColumnIfMissing(
        'smsApiKey',
        `"smsApiKey" character varying(255)`,
      );
      await addColumnIfMissing('smsMask', `"smsMask" character varying(100)`);
      await addColumnIfMissing(
        'smsApiUrl',
        `"smsApiUrl" character varying(500)`,
      );
      await addColumnIfMissing(
        'smsTestMode',
        `"smsTestMode" boolean NOT NULL DEFAULT true`,
      );

      // Add WhatsApp configuration columns
      await addColumnIfMissing(
        'whatsappEnabled',
        `"whatsappEnabled" boolean NOT NULL DEFAULT false`,
      );
      await addColumnIfMissing(
        'whatsappDeviceId',
        `"whatsappDeviceId" character varying(255)`,
      );
      await addColumnIfMissing(
        'whatsappApiUrl',
        `"whatsappApiUrl" character varying(500)`,
      );

      // Check if default settings need to be inserted
      const existingCount = await queryRunner.query(
        `SELECT COUNT(*) as count FROM "settings"`,
      );
      if (existingCount[0]?.count === '0' || !existingCount[0]) {
        await queryRunner.query(`
          INSERT INTO "settings" (
            "appName", "appTitle", "metaDescription", "defaultTimezone",
            "smtpSecure", "smtpIgnoreTls", "smtpRequireTls"
          ) VALUES (
            'LMS Portal',
            'LMS Portal - Education Management System',
            'Comprehensive education management system for schools and institutions',
            'Asia/Karachi',
            false,
            false,
            true
          )
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
  }
}

