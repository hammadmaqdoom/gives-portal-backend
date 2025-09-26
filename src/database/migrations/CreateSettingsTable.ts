import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettingsTable1700000000000 implements MigrationInterface {
  name = 'CreateSettingsTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_settings" PRIMARY KEY ("id")
      )
    `);

    // Insert default settings
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "settings"`);
  }
}
