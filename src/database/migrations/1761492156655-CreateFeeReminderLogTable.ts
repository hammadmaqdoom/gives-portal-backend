import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFeeReminderLogTable1761492156655 implements MigrationInterface {
    name = 'CreateFeeReminderLogTable1761492156655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create fee reminder log table
        await queryRunner.query(`CREATE TYPE "public"."fee_reminder_log_remindertype_enum" AS ENUM('email', 'sms', 'whatsapp')`);
        await queryRunner.query(`CREATE TYPE "public"."fee_reminder_log_status_enum" AS ENUM('pending', 'sent', 'failed')`);
        await queryRunner.query(`CREATE TABLE "fee_reminder_log" ("id" SERIAL NOT NULL, "studentId" integer NOT NULL, "parentId" integer, "invoiceId" integer, "reminderType" "public"."fee_reminder_log_remindertype_enum" NOT NULL, "status" "public"."fee_reminder_log_status_enum" NOT NULL DEFAULT 'pending', "message" text NOT NULL, "recipient" character varying(255) NOT NULL, "sentAt" TIMESTAMP, "errorMessage" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0423af443db671842710e5f3ee5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5d39d32877d722812d5ad3ce32" ON "fee_reminder_log" ("studentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b847e5a41133ccf52bf71b472a" ON "fee_reminder_log" ("reminderType") `);
        await queryRunner.query(`CREATE INDEX "IDX_3af8d31ad01981d45b99ee1aa1" ON "fee_reminder_log" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop fee reminder log table
        await queryRunner.query(`DROP INDEX "public"."IDX_3af8d31ad01981d45b99ee1aa1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b847e5a41133ccf52bf71b472a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d39d32877d722812d5ad3ce32"`);
        await queryRunner.query(`DROP TABLE "fee_reminder_log"`);
        await queryRunner.query(`DROP TYPE "public"."fee_reminder_log_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."fee_reminder_log_remindertype_enum"`);
    }
}
