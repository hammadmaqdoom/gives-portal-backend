import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoiceTable1754308080006 implements MigrationInterface {
  name = 'CreateInvoiceTable1754308080006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invoice" (
        "id" SERIAL PRIMARY KEY,
        "invoiceNumber" varchar NOT NULL UNIQUE,
        "studentId" integer NOT NULL,
        "parentId" integer,
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar NOT NULL DEFAULT 'USD',
        "status" varchar NOT NULL DEFAULT 'draft',
        "dueDate" date NOT NULL,
        "generatedDate" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "paidDate" timestamp,
        "paymentMethod" varchar,
        "transactionId" varchar,
        "description" text NOT NULL,
        "notes" text,
        "paymentProofUrl" varchar,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" timestamp
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_invoiceNumber" ON "invoice" ("invoiceNumber")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_studentId" ON "invoice" ("studentId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_parentId" ON "invoice" ("parentId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_status" ON "invoice" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_dueDate" ON "invoice" ("dueDate")
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice" 
      ADD CONSTRAINT "FK_invoice_student" 
      FOREIGN KEY ("studentId") 
      REFERENCES "student"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice" 
      ADD CONSTRAINT "FK_invoice_parent" 
      FOREIGN KEY ("parentId") 
      REFERENCES "parent"("id") 
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT "FK_invoice_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT "FK_invoice_student"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_invoice_dueDate"`);
    await queryRunner.query(`DROP INDEX "IDX_invoice_status"`);
    await queryRunner.query(`DROP INDEX "IDX_invoice_parentId"`);
    await queryRunner.query(`DROP INDEX "IDX_invoice_studentId"`);
    await queryRunner.query(`DROP INDEX "IDX_invoice_invoiceNumber"`);
    await queryRunner.query(`DROP TABLE "invoice"`);
  }
}
