import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvoiceItemsOnly1757159231198 implements MigrationInterface {
  name = 'AddInvoiceItemsOnly1757159231198';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the invoice_item table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "invoice_item" (
        "id" SERIAL NOT NULL, 
        "description" text NOT NULL, 
        "quantity" integer NOT NULL DEFAULT '1', 
        "unitPrice" numeric(10,2) NOT NULL, 
        "total" numeric(10,2) NOT NULL, 
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
        "invoiceId" integer,
        CONSTRAINT "PK_621317346abdf61295516f3cb76" PRIMARY KEY ("id")
      )`,
    );

    // Add foreign key constraint to invoice table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_553d5aac210d22fdca5c8d48ead'
        ) THEN
          ALTER TABLE "invoice_item" 
          ADD CONSTRAINT "FK_553d5aac210d22fdca5c8d48ead" 
          FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "invoice_item" DROP CONSTRAINT "FK_553d5aac210d22fdca5c8d48ead"`,
    );

    // Drop the invoice_item table
    await queryRunner.query(`DROP TABLE "invoice_item"`);
  }
}
