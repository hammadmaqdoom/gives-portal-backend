import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBatchTermsTable1767000000000 implements MigrationInterface {
  name = 'CreateBatchTermsTable1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create batch_terms table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "batch_term" (
        "id" SERIAL NOT NULL,
        "name" VARCHAR NOT NULL,
        "description" VARCHAR,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "display_order" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_batch_term" PRIMARY KEY ("id")
      )`,
    );

    // Create unique index on name
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_batch_term_name" ON "batch_term" ("name") WHERE "deleted_at" IS NULL`,
    );

    // Create index on is_active for filtering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_batch_term_is_active" ON "batch_term" ("is_active")`,
    );

    // Insert some default batch terms
    await queryRunner.query(
      `INSERT INTO "batch_term" ("name", "description", "is_active", "display_order") VALUES
        ('May/June 2026', 'Cambridge Summer May/June Session 2026', true, 1),
        ('Oct/Nov 2026', 'Cambridge Winter Oct/Nov Session 2026', true, 1),
        ('May/June 2027', 'Cambridge Summer May/June Session 2027', true, 1),
        ('Oct/Nov 2027', 'Cambridge Winter Oct/Nov Session 2027', true, 1)
      ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_batch_term_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_batch_term_name"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "batch_term"`);
  }
}
