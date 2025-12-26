import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartTables1762000000001 implements MigrationInterface {
  name = 'CreateCartTables1762000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create cart table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "sessionId" VARCHAR,
        "currency" VARCHAR NOT NULL DEFAULT 'USD',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create cart_item table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart_item" (
        "id" SERIAL PRIMARY KEY,
        "cartId" INTEGER NOT NULL,
        "classId" INTEGER NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "currency" VARCHAR NOT NULL DEFAULT 'USD',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Add foreign key constraint with existence check
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_cart_item_cart') THEN
          ALTER TABLE "cart_item" 
          ADD CONSTRAINT "FK_cart_item_cart" 
          FOREIGN KEY ("cartId") 
          REFERENCES "cart"("id") 
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cart_userId" ON "cart" ("userId") WHERE "userId" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cart_sessionId" ON "cart" ("sessionId") WHERE "sessionId" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cart_item_cartId" ON "cart_item" ("cartId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cart_item_classId" ON "cart_item" ("classId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cart_item_classId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cart_item_cartId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cart_sessionId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cart_userId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_item"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cart"`);
  }
}

