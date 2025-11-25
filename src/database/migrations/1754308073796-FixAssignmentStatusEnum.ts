import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAssignmentStatusEnum1754308073796
  implements MigrationInterface
{
  name = 'FixAssignmentStatusEnum1754308073796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, create the enum type if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."assignment_status_enum" AS ENUM('draft', 'published', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Update existing status values to ensure they match the enum
    await queryRunner.query(`
      UPDATE "assignment" 
      SET "status" = 'draft' 
      WHERE "status" IS NULL OR "status" NOT IN ('draft', 'published', 'closed')
    `);

    // Remove the default value first
    await queryRunner.query(`
      ALTER TABLE "assignment" 
      ALTER COLUMN "status" DROP DEFAULT
    `);

    // Change the column type to enum
    await queryRunner.query(`
      ALTER TABLE "assignment" 
      ALTER COLUMN "status" TYPE "public"."assignment_status_enum" 
      USING "status"::"public"."assignment_status_enum"
    `);

    // Set the default value
    await queryRunner.query(`
      ALTER TABLE "assignment" 
      ALTER COLUMN "status" SET DEFAULT 'draft'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the default first
    await queryRunner.query(`
      ALTER TABLE "assignment" 
      ALTER COLUMN "status" DROP DEFAULT
    `);

    // Revert back to character varying
    await queryRunner.query(`
      ALTER TABLE "assignment" 
      ALTER COLUMN "status" TYPE character varying
    `);

    // Set the default back to 'draft'
    await queryRunner.query(`
      ALTER TABLE "assignment" 
      ALTER COLUMN "status" SET DEFAULT 'draft'
    `);

    // Drop the enum type
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."assignment_status_enum"`,
    );
  }
}
