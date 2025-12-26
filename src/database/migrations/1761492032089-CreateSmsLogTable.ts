import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSmsLogTable1761492032089 implements MigrationInterface {
  name = 'CreateSmsLogTable1761492032089';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create SMS log table
    await queryRunner.query(
      `CREATE TYPE "public"."sms_log_status_enum" AS ENUM('pending', 'sent', 'delivered', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sms_log" ("id" SERIAL NOT NULL, "recipient" character varying(20) NOT NULL, "message" text NOT NULL, "provider" character varying(100) NOT NULL, "messageId" character varying(100), "status" "public"."sms_log_status_enum" NOT NULL DEFAULT 'pending', "statusCode" character varying(10), "errorMessage" text, "sentAt" TIMESTAMP, "deliveredAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8554ae1be4b0fb14d36cb190b61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_83ec87976c9856a9ecdaab8620" ON "sms_log" ("recipient") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a5f710272dbe4b8251aebfeb65" ON "sms_log" ("status") `,
    );

    // Add SMS configuration columns to settings table
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smsEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smsProvider" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smsApiEmail" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smsApiKey" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smsMask" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smsApiUrl" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "smsTestMode" boolean NOT NULL DEFAULT true`,
    );

    // Add WhatsApp configuration columns to settings table
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "whatsappEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "whatsappDeviceId" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "whatsappApiUrl" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove WhatsApp configuration columns
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "whatsappApiUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "whatsappDeviceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" DROP COLUMN "whatsappEnabled"`,
    );

    // Remove SMS configuration columns
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "smsTestMode"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "smsApiUrl"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "smsMask"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "smsApiKey"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "smsApiEmail"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "smsProvider"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "smsEnabled"`);

    // Drop SMS log table
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a5f710272dbe4b8251aebfeb65"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_83ec87976c9856a9ecdaab8620"`,
    );
    await queryRunner.query(`DROP TABLE "sms_log"`);
    await queryRunner.query(`DROP TYPE "public"."sms_log_status_enum"`);
  }
}
