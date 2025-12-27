import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseImageFileIds1766000000000
  implements MigrationInterface
{
  name = 'AddCourseImageFileIds1766000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add file ID columns for course images
    await queryRunner.query(
      `ALTER TABLE "class" ADD COLUMN IF NOT EXISTS "thumbnail_file_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD COLUMN IF NOT EXISTS "cover_image_file_id" uuid`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_class_thumbnail_file" FOREIGN KEY ("thumbnail_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_class_cover_image_file" FOREIGN KEY ("cover_image_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Create indexes for better query performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_class_thumbnail_file_id" ON "class" ("thumbnail_file_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_class_cover_image_file_id" ON "class" ("cover_image_file_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_class_cover_image_file_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_class_thumbnail_file_id"`,
    );

    // Remove foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "FK_class_cover_image_file"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "FK_class_thumbnail_file"`,
    );

    // Remove columns
    await queryRunner.query(
      `ALTER TABLE "class" DROP COLUMN IF EXISTS "cover_image_file_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP COLUMN IF EXISTS "thumbnail_file_id"`,
    );
  }
}

