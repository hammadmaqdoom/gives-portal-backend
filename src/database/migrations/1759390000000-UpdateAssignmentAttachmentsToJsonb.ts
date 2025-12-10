import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAssignmentAttachmentsToJsonb1759390000000
  implements MigrationInterface
{
  name = 'UpdateAssignmentAttachmentsToJsonb1759390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, add a temporary column for the new jsonb data
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments_temp'
        ) THEN
          ALTER TABLE "assignment" ADD COLUMN "attachments_temp" jsonb;
        END IF;
      END $$;
    `);

    // Convert existing text[] data to jsonb format
    // Each string in the array becomes a simple object with url property
    await queryRunner.query(`
      UPDATE "assignment" 
      SET "attachments_temp" = (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object('url', elem)
          ),
          '[]'::jsonb
        )
        FROM unnest("attachments") AS elem
        WHERE "attachments" IS NOT NULL
      )
      WHERE "attachments" IS NOT NULL
    `);

    // Drop the old column (only if it exists and attachments_temp exists)
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments_temp'
        ) THEN
          ALTER TABLE "assignment" DROP COLUMN "attachments";
        END IF;
      END $$;
    `);

    // Rename the temporary column to the original name (only if attachments doesn't exist)
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments_temp'
        ) THEN
          ALTER TABLE "assignment" RENAME COLUMN "attachments_temp" TO "attachments";
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add a temporary column for text array
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments_temp'
        ) THEN
          ALTER TABLE "assignment" ADD COLUMN "attachments_temp" text[];
        END IF;
      END $$;
    `);

    // Convert jsonb data back to text array (extract url field)
    await queryRunner.query(`
      UPDATE "assignment" 
      SET "attachments_temp" = (
        SELECT array_agg(att->>'url')
        FROM jsonb_array_elements("attachments") AS att
        WHERE "attachments" IS NOT NULL
      )
      WHERE "attachments" IS NOT NULL
    `);

    // Drop the jsonb column (only if it exists and attachments_temp exists)
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments_temp'
        ) THEN
          ALTER TABLE "assignment" DROP COLUMN "attachments";
        END IF;
      END $$;
    `);

    // Rename the temporary column back (only if attachments doesn't exist)
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'assignment' AND column_name = 'attachments_temp'
        ) THEN
          ALTER TABLE "assignment" RENAME COLUMN "attachments_temp" TO "attachments";
        END IF;
      END $$;
    `);
  }
}
