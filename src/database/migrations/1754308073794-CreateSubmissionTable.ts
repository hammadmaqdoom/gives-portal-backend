import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubmissionTable1754308073794 implements MigrationInterface {
  name = 'CreateSubmissionTable1754308073794';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."submission_status_enum" AS ENUM('pending', 'submitted', 'graded', 'late')
    `);

    await queryRunner.query(`
      CREATE TABLE "submission" (
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
      ALTER TABLE "submission" 
      ADD CONSTRAINT "FK_submission_student" 
      FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "submission" 
      ADD CONSTRAINT "FK_submission_assignment" 
      FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "submission" DROP CONSTRAINT "FK_submission_assignment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submission" DROP CONSTRAINT "FK_submission_student"`,
    );
    await queryRunner.query(`DROP TABLE "submission"`);
    await queryRunner.query(`DROP TYPE "public"."submission_status_enum"`);
  }
}
