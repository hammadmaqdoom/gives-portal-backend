import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInvoiceGenerationLogTable1761492374742 implements MigrationInterface {
    name = 'CreateInvoiceGenerationLogTable1761492374742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create invoice generation log table
        await queryRunner.query(`CREATE TYPE "public"."invoice_generation_log_generationtype_enum" AS ENUM('monthly', 'quarterly', 'yearly', 'manual')`);
        await queryRunner.query(`CREATE TYPE "public"."invoice_generation_log_status_enum" AS ENUM('success', 'failed', 'skipped')`);
        await queryRunner.query(`CREATE TABLE "invoice_generation_log" ("id" SERIAL NOT NULL, "studentId" integer NOT NULL, "classId" integer NOT NULL, "invoiceId" integer, "generationType" "public"."invoice_generation_log_generationtype_enum" NOT NULL, "status" "public"."invoice_generation_log_status_enum" NOT NULL DEFAULT 'success', "reason" text, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL, "periodStart" TIMESTAMP NOT NULL, "periodEnd" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_97a82450bc26061ca782e3df3b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a2d8c6585dbef50f0df89a5b26" ON "invoice_generation_log" ("studentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_846c7398495d586987f097dd44" ON "invoice_generation_log" ("classId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f2b63fcc196e60e85d9023f3ed" ON "invoice_generation_log" ("generationType") `);
        await queryRunner.query(`CREATE INDEX "IDX_bb6e73a6da6bdbe1d88fd97a93" ON "invoice_generation_log" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop invoice generation log table
        await queryRunner.query(`DROP INDEX "public"."IDX_bb6e73a6da6bdbe1d88fd97a93"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f2b63fcc196e60e85d9023f3ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_846c7398495d586987f097dd44"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a2d8c6585dbef50f0df89a5b26"`);
        await queryRunner.query(`DROP TABLE "invoice_generation_log"`);
        await queryRunner.query(`DROP TYPE "public"."invoice_generation_log_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invoice_generation_log_generationtype_enum"`);
    }
}
