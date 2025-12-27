import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicCourseCatalogFields1762000000000
  implements MigrationInterface
{
  name = 'AddPublicCourseCatalogFields1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add fields to class table for public course catalog
    await queryRunner.query(
      `ALTER TABLE "class" ADD COLUMN IF NOT EXISTS "is_public_for_sale" BOOLEAN NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD COLUMN IF NOT EXISTS "thumbnail_url" VARCHAR`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD COLUMN IF NOT EXISTS "cover_image_url" VARCHAR`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD COLUMN IF NOT EXISTS "features" JSONB`,
    );

    // Add index on is_public_for_sale for performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_class_is_public_for_sale" ON "class" ("is_public_for_sale") WHERE "is_public_for_sale" = true`,
    );

    // Add is_previewable field to learning_module table
    await queryRunner.query(
      `ALTER TABLE "learning_module" ADD COLUMN IF NOT EXISTS "is_previewable" BOOLEAN NOT NULL DEFAULT false`,
    );

    // Add index on is_previewable for performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_learning_module_is_previewable" ON "learning_module" ("is_previewable") WHERE "is_previewable" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_learning_module_is_previewable"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_class_is_public_for_sale"`,
    );

    // Remove fields from learning_module table
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP COLUMN "is_previewable"`,
    );

    // Remove fields from class table
    await queryRunner.query(
      `ALTER TABLE "class" DROP COLUMN "features"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP COLUMN "cover_image_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP COLUMN "thumbnail_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP COLUMN "is_public_for_sale"`,
    );
  }
}

