import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFaceRecognitionTables1795000000000
  implements MigrationInterface
{
  name = 'CreateFaceRecognitionTables1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Face embedding table — one student can have multiple samples
    //    (e.g. front, slight-left, slight-right, with/without glasses).
    //    We store the 128-float descriptor from face-api.js, never raw images.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_face_embedding" (
        "id" SERIAL NOT NULL,
        "studentId" integer NOT NULL,
        "embedding" real[] NOT NULL,
        "modelName" varchar(128) NOT NULL,
        "qualityScore" real,
        "sourceFileId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_student_face_embedding" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_student_face_embedding_studentId"
        ON "student_face_embedding" ("studentId")
        WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_student_face_embedding_student') THEN
          ALTER TABLE "student_face_embedding"
          ADD CONSTRAINT "FK_student_face_embedding_student"
          FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_student_face_embedding_file') THEN
          ALTER TABLE "student_face_embedding"
          ADD CONSTRAINT "FK_student_face_embedding_file"
          FOREIGN KEY ("sourceFileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // 2. Record how the attendance row was captured so we can report on it
    //    and audit the face-recognition pipeline. Nullable keeps legacy rows valid.
    await queryRunner.query(`
      ALTER TABLE "attendance"
      ADD COLUMN IF NOT EXISTS "matchedBy" varchar(32)
    `);

    // 3. Prevent duplicate attendance rows per (student, class, date).
    //    Partial index so soft-deleted rows don't block re-creation.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_attendance_student_class_date"
        ON "attendance" ("studentId", "classId", "date")
        WHERE "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_attendance_student_class_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP COLUMN IF EXISTS "matchedBy"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "student_face_embedding"`);
  }
}
