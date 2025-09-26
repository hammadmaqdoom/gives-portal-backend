import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePerformanceAndFees1715028537219
  implements MigrationInterface
{
  name = 'CreatePerformanceAndFees1715028537219';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create performance table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'performance_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."performance_status_enum" AS ENUM('present', 'absent', 'late', 'excused');
        END IF;
      END $$;
    `);

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

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_performance_student" ON "performance" ("studentId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_performance_assignment" ON "performance" ("assignmentId")
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_performance_student'
        ) THEN
          ALTER TABLE "performance" ADD CONSTRAINT "FK_performance_student" 
          FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_performance_assignment'
        ) THEN
          ALTER TABLE "performance" ADD CONSTRAINT "FK_performance_assignment" 
          FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // Create fee table
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
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_fee_student'
        ) THEN
          ALTER TABLE "fee" ADD CONSTRAINT "FK_fee_student" 
          FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_fee_class'
        ) THEN
          ALTER TABLE "fee" ADD CONSTRAINT "FK_fee_class" 
          FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop fee table
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_fee_class') THEN
          ALTER TABLE "fee" DROP CONSTRAINT "FK_fee_class";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_fee_student') THEN
          ALTER TABLE "fee" DROP CONSTRAINT "FK_fee_student";
        END IF;
      END $$;
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_dueDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_class"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_student"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payment_method_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."payment_status_enum"`,
    );

    // Drop performance table
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_performance_assignment') THEN
          ALTER TABLE "performance" DROP CONSTRAINT "FK_performance_assignment";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_performance_student') THEN
          ALTER TABLE "performance" DROP CONSTRAINT "FK_performance_student";
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_performance_assignment"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performance_student"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."performance_status_enum"`,
    );
  }
}
