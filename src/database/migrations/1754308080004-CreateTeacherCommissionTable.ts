import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeacherCommissionTable1754308080004
  implements MigrationInterface
{
  name = 'CreateTeacherCommissionTable1754308080004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for commission status
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'teacher_commission_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."teacher_commission_status_enum" AS ENUM('pending', 'calculated', 'paid', 'cancelled');
        END IF;
      END $$;
    `);

    // Create teacher_commission table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "teacher_commission" (
        "id" SERIAL NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "commissionPercentage" decimal(5,2) NOT NULL,
        "commissionAmount" decimal(10,2) NOT NULL,
        "status" "public"."teacher_commission_status_enum" NOT NULL DEFAULT 'pending',
        "dueDate" TIMESTAMP NOT NULL,
        "paidAt" TIMESTAMP,
        "description" varchar,
        "transactionId" varchar,
        "teacherId" integer,
        "classId" integer,
        "studentId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_teacher_commission" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_teacher_commission_teacher'
        ) THEN
          ALTER TABLE "teacher_commission"
          ADD CONSTRAINT "FK_teacher_commission_teacher" 
          FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_teacher_commission_class'
        ) THEN
          ALTER TABLE "teacher_commission"
          ADD CONSTRAINT "FK_teacher_commission_class" 
          FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_teacher_commission_student'
        ) THEN
          ALTER TABLE "teacher_commission"
          ADD CONSTRAINT "FK_teacher_commission_student" 
          FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_teacher_commission_status" ON "teacher_commission" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_teacher_commission_teacher" ON "teacher_commission" ("teacherId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_teacher_commission_class" ON "teacher_commission" ("classId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_teacher_commission_student" ON "teacher_commission" ("studentId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_teacher_commission_due_date" ON "teacher_commission" ("dueDate")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_teacher_commission_due_date"`);
    await queryRunner.query(`DROP INDEX "IDX_teacher_commission_student"`);
    await queryRunner.query(`DROP INDEX "IDX_teacher_commission_class"`);
    await queryRunner.query(`DROP INDEX "IDX_teacher_commission_teacher"`);
    await queryRunner.query(`DROP INDEX "IDX_teacher_commission_status"`);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" DROP CONSTRAINT "FK_teacher_commission_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" DROP CONSTRAINT "FK_teacher_commission_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" DROP CONSTRAINT "FK_teacher_commission_teacher"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE "teacher_commission"`);

    // Drop enum
    await queryRunner.query(
      `DROP TYPE "public"."teacher_commission_status_enum"`,
    );
  }
}
