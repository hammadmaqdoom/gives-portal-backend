import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsToModuleCompletion1758700000005 implements MigrationInterface {
  name = 'AddMissingColumnsToModuleCompletion1758700000005'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add progress_percentage if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'module_completion' AND column_name = 'progress_percentage'
        ) THEN
          ALTER TABLE module_completion ADD COLUMN progress_percentage int NOT NULL DEFAULT 0;
        END IF;
      END
      $$;
    `);

    // Add time_spent if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'module_completion' AND column_name = 'time_spent'
        ) THEN
          ALTER TABLE module_completion ADD COLUMN time_spent int NOT NULL DEFAULT 0;
        END IF;
      END
      $$;
    `);

    // Add completion_data if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'module_completion' AND column_name = 'completion_data'
        ) THEN
          ALTER TABLE module_completion ADD COLUMN completion_data jsonb NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop added columns (safe to attempt even if they don't exist)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'module_completion' AND column_name = 'completion_data'
        ) THEN
          ALTER TABLE module_completion DROP COLUMN completion_data;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'module_completion' AND column_name = 'time_spent'
        ) THEN
          ALTER TABLE module_completion DROP COLUMN time_spent;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'module_completion' AND column_name = 'progress_percentage'
        ) THEN
          ALTER TABLE module_completion DROP COLUMN progress_percentage;
        END IF;
      END
      $$;
    `);
  }
}


