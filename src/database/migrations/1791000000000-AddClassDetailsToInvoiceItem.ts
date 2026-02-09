import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClassDetailsToInvoiceItem1791000000000
  implements MigrationInterface
{
  name = 'AddClassDetailsToInvoiceItem1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoice_item" ADD COLUMN IF NOT EXISTS "classId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_item" ADD COLUMN IF NOT EXISTS "className" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_item" ADD COLUMN IF NOT EXISTS "teacherName" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoice_item" DROP COLUMN IF EXISTS "teacherName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_item" DROP COLUMN IF EXISTS "className"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_item" DROP COLUMN IF EXISTS "classId"`,
    );
  }
}
