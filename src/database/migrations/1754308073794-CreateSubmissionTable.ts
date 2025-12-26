import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubmissionTable1754308073794 implements MigrationInterface {
  name = 'CreateSubmissionTable1754308073794';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = 'submission_status_enum' AND n.nspname = 'public'
        ) THEN
          CREATE TYPE "public"."submission_status_enum" AS ENUM('pending', 'submitted', 'graded', 'late');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "submission" (
        "id" SERIAL NOT NULL,
        "status" "public"."submission_status_enum" NOT NULL DEFAULT 'pending',
        "score" integer,
        "grade" character varying,
        "comments" character varying,
        "fileUrl" character varying,
        "attachments" text[],
        "submittedAt" TIMESTAMP,
        "gradedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "studentId" integer,
        "assignmentId" integer,
        CONSTRAINT "PK_submission" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_submission_student') THEN
          ALTER TABLE "submission" 
          ADD CONSTRAINT "FK_submission_student" 
          FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_submission_assignment') THEN
          ALTER TABLE "submission" 
          ADD CONSTRAINT "FK_submission_assignment" 
          FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "submission" DROP CONSTRAINT IF EXISTS "FK_submission_assignment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submission" DROP CONSTRAINT IF EXISTS "FK_submission_student"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "submission"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."submission_status_enum"`);
  }
}
