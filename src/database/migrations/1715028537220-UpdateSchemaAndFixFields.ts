import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchemaAndFixFields1715028537220
  implements MigrationInterface
{
  name = 'UpdateSchemaAndFixFields1715028537220';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if fee table exists and drop it if it does (to recreate with proper structure)
    const feeTableExists = await queryRunner.hasTable('fee');
    if (feeTableExists) {
      // Drop existing fee table and recreate with proper structure
      await queryRunner.query(
        `ALTER TABLE "fee" DROP CONSTRAINT IF EXISTS "FK_fee_class"`,
      );
      await queryRunner.query(
        `ALTER TABLE "fee" DROP CONSTRAINT IF EXISTS "FK_fee_student"`,
      );
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_dueDate"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_class"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_student"`);
      await queryRunner.query(`DROP TABLE "fee"`);
    }

    // Check if performance table exists and drop it if it does
    const performanceTableExists = await queryRunner.hasTable('performance');
    if (performanceTableExists) {
      await queryRunner.query(
        `ALTER TABLE "performance" DROP CONSTRAINT IF EXISTS "FK_performance_assignment"`,
      );
      await queryRunner.query(
        `ALTER TABLE "performance" DROP CONSTRAINT IF EXISTS "FK_performance_student"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_performance_assignment"`,
      );
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performance_student"`);
      await queryRunner.query(`DROP TABLE "performance"`);
    }

    // Drop existing enums if they exist
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payment_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payment_method_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."performance_status_enum"`,
    );

    // Create proper enums
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'payment_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."payment_status_enum" AS ENUM('paid', 'unpaid', 'partial', 'overdue');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'payment_method_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."payment_method_enum" AS ENUM('cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'online');
        END IF;
      END $$;
    `);

    // Create performance table with proper structure
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "performance" (
        "id" SERIAL NOT NULL,
        "score" integer NOT NULL,
        "comments" character varying,
        "grade" character varying,
        "submittedAt" TIMESTAMP,
        "gradedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "studentId" integer,
        "assignmentId" integer,
        CONSTRAINT "PK_performance" PRIMARY KEY ("id")
      )
    `);

    // Create fee table with proper structure
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fee" (
        "id" SERIAL NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "status" "public"."payment_status_enum" NOT NULL,
        "paymentMethod" "public"."payment_method_enum",
        "transactionId" character varying,
        "dueDate" TIMESTAMP NOT NULL,
        "paidAt" TIMESTAMP,
        "description" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "studentId" integer,
        "classId" integer,
        CONSTRAINT "PK_fee" PRIMARY KEY ("id")
      )
    `);

    // Add missing fields to existing tables
    // Add maxScore to assignment table
    await queryRunner.query(`
      ALTER TABLE "assignment" ADD COLUMN IF NOT EXISTS "maxScore" integer
    `);

    // Add notes to attendance table
    await queryRunner.query(`
      ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "notes" character varying
    `);

    // Add deletedAt to attendance table
    await queryRunner.query(`
      ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP
    `);

    // Add deletedAt to assignment table
    await queryRunner.query(`
      ALTER TABLE "assignment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP
    `);

    // Add deletedAt to student_performance table
    await queryRunner.query(`
      ALTER TABLE "student_performance" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP
    `);

    // Add deletedAt to fee table (old one)
    await queryRunner.query(`
      ALTER TABLE "fee" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP
    `);

    // Create indexes for performance table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_performance_student" ON "performance" ("studentId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_performance_assignment" ON "performance" ("assignmentId")
    `);

    // Create indexes for fee table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fee_student" ON "fee" ("studentId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fee_class" ON "fee" ("classId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fee_dueDate" ON "fee" ("dueDate")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fee_status" ON "fee" ("status")
    `);

    // Add foreign key constraints for performance table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_performance_student') THEN
          ALTER TABLE "performance" ADD CONSTRAINT "FK_performance_student" 
          FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_performance_assignment') THEN
          ALTER TABLE "performance" ADD CONSTRAINT "FK_performance_assignment" 
          FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // Add foreign key constraints for fee table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_fee_student') THEN
          ALTER TABLE "fee" ADD CONSTRAINT "FK_fee_student" 
          FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_fee_class') THEN
          ALTER TABLE "fee" ADD CONSTRAINT "FK_fee_class" 
          FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // Add missing indexes for existing tables
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_assignment_maxScore" ON "assignment" ("maxScore")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attendance_notes" ON "attendance" ("notes")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fee_transactionId" ON "fee" ("transactionId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fee_paymentMethod" ON "fee" ("paymentMethod")
    `);

    // Update existing data to set default values for new fields
    await queryRunner.query(`
      UPDATE "assignment" SET "maxScore" = 100 WHERE "maxScore" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "attendance" SET "notes" = '' WHERE "notes" IS NULL
    `);

    // Set default values for new enum fields in fee table
    await queryRunner.query(`
      UPDATE "fee" SET "status" = 'unpaid'::payment_status_enum WHERE "status" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "fee" DROP CONSTRAINT IF EXISTS "FK_fee_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" DROP CONSTRAINT IF EXISTS "FK_fee_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" DROP CONSTRAINT IF EXISTS "FK_performance_assignment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" DROP CONSTRAINT IF EXISTS "FK_performance_student"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_paymentMethod"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_transactionId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_notes"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assignment_maxScore"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_dueDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_class"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_student"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_performance_assignment"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performance_student"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "fee"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance"`);

    // Drop enums
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payment_method_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payment_status_enum"`,
    );

    // Remove added columns
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN IF EXISTS "maxScore"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP COLUMN IF EXISTS "notes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP COLUMN IF EXISTS "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN IF EXISTS "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_performance" DROP COLUMN IF EXISTS "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" DROP COLUMN IF EXISTS "deletedAt"`,
    );
  }
}
