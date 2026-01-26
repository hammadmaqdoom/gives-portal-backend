import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoFileIdToLearningModule1770000000000
  implements MigrationInterface
{
  name = 'AddVideoFileIdToLearningModule1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add video_file_id column to learning_module table
    await queryRunner.query(`
      ALTER TABLE "learning_module" 
      ADD COLUMN IF NOT EXISTS "video_file_id" uuid
    `);

    // Add foreign key constraint to files table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_learning_module_video_file'
        ) THEN
          ALTER TABLE "learning_module" 
          ADD CONSTRAINT "FK_learning_module_video_file" 
          FOREIGN KEY ("video_file_id") 
          REFERENCES "files"("id") 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Create index for video_file_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_learning_module_video_file_id" 
      ON "learning_module" ("video_file_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "learning_module" 
      DROP CONSTRAINT IF EXISTS "FK_learning_module_video_file"
    `);

    // Remove index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_learning_module_video_file_id"
    `);

    // Remove column
    await queryRunner.query(`
      ALTER TABLE "learning_module" 
      DROP COLUMN IF EXISTS "video_file_id"
    `);
  }
}
