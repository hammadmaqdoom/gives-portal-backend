import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudentModuleNoteTable1792000000000
  implements MigrationInterface
{
  name = 'CreateStudentModuleNoteTable1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_module_note" (
        "id" SERIAL NOT NULL,
        "module_id" integer NOT NULL,
        "student_id" integer NOT NULL,
        "note_content" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_module_note" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_student_module_note_student_module" UNIQUE ("student_id", "module_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_student_module_note_module_id" ON "student_module_note" ("module_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_student_module_note_student_id" ON "student_module_note" ("student_id")
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_student_module_note_module') THEN
          ALTER TABLE "student_module_note" 
          ADD CONSTRAINT "FK_student_module_note_module" 
          FOREIGN KEY ("module_id") REFERENCES "learning_module"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_student_module_note_student') THEN
          ALTER TABLE "student_module_note" 
          ADD CONSTRAINT "FK_student_module_note_student" 
          FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "student_module_note"
    `);
  }
}
