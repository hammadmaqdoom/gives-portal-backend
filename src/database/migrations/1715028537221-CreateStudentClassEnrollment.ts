import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudentClassEnrollment1715028537221
  implements MigrationInterface
{
  name = 'CreateStudentClassEnrollment1715028537221';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create student_class_enrollment table
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "student_class_enrollment" (
        "id" SERIAL NOT NULL,
        "studentId" integer NOT NULL,
        "classId" integer NOT NULL,
        "enrollmentDate" TIMESTAMP NOT NULL DEFAULT now(),
        "status" character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_student_class_enrollment" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_student_class_enrollment" UNIQUE ("studentId", "classId")
      )`,
    );

    // Add foreign key constraints for enrollment table
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_enrollment_student') THEN
          ALTER TABLE "student_class_enrollment" ADD CONSTRAINT "FK_enrollment_student" 
          FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_enrollment_class') THEN
          ALTER TABLE "student_class_enrollment" ADD CONSTRAINT "FK_enrollment_class" 
          FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // Create indexes for enrollment table
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_enrollment_student_id" ON "student_class_enrollment" ("studentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_enrollment_class_id" ON "student_class_enrollment" ("classId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_enrollment_status" ON "student_class_enrollment" ("status")`,
    );

    // Migrate existing data from student.classId to enrollment table
    await queryRunner.query(
      `INSERT INTO "student_class_enrollment" ("studentId", "classId", "enrollmentDate", "status")
       SELECT "id", "classId", "createdAt", 'active'
       FROM "student" 
       WHERE "classId" IS NOT NULL`,
    );

    // Remove the classId column from student table
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT IF EXISTS "FK_student_class"`,
    );
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN IF EXISTS "classId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back the classId column to student table
    await queryRunner.query(
      `ALTER TABLE "student" ADD COLUMN "classId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_student_class" 
       FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Migrate data back from enrollment to student table (take the first active enrollment)
    await queryRunner.query(
      `UPDATE "student" SET "classId" = (
         SELECT "classId" 
         FROM "student_class_enrollment" 
         WHERE "studentId" = "student"."id" AND "status" = 'active' 
         ORDER BY "enrollmentDate" ASC 
         LIMIT 1
       )`,
    );

    // Drop indexes for enrollment table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_enrollment_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_enrollment_class_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_enrollment_student_id"`);

    // Drop foreign key constraints for enrollment table
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP CONSTRAINT IF EXISTS "FK_enrollment_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP CONSTRAINT IF EXISTS "FK_enrollment_student"`,
    );

    // Drop the enrollment table
    await queryRunner.query(`DROP TABLE IF EXISTS "student_class_enrollment"`);
  }
}
