import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClassScheduling1754308073799 implements MigrationInterface {
  name = 'AddClassScheduling1754308073799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for weekdays
    await queryRunner.query(`
      CREATE TYPE "public"."weekday_enum" AS ENUM(
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      )
    `);

    // Create class_schedule table
    await queryRunner.query(`
      CREATE TABLE "class_schedule" (
        "id" SERIAL NOT NULL,
        "classId" integer NOT NULL,
        "weekday" "public"."weekday_enum" NOT NULL,
        "startTime" character varying NOT NULL,
        "endTime" character varying NOT NULL,
        "timezone" character varying NOT NULL DEFAULT 'Asia/Karachi',
        "isActive" boolean NOT NULL DEFAULT true,
        "effectiveFrom" date,
        "effectiveUntil" date,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_class_schedule" PRIMARY KEY ("id")
      )
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_class_schedule_class_id" ON "class_schedule" ("classId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_class_schedule_weekday" ON "class_schedule" ("weekday")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_class_schedule_active" ON "class_schedule" ("isActive")
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "class_schedule" 
      ADD CONSTRAINT "FK_class_schedule_class" 
      FOREIGN KEY ("classId") 
      REFERENCES "class"("id") 
      ON DELETE CASCADE
    `);

    // Add timezone column to class table
    await queryRunner.query(`
      ALTER TABLE "class" 
      ADD COLUMN "timezone" character varying NOT NULL DEFAULT 'Asia/Karachi'
    `);

    // Make legacy fields nullable
    await queryRunner.query(`
      ALTER TABLE "class" 
      ALTER COLUMN "weekdays" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "class" 
      ALTER COLUMN "timing" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "class_schedule" 
      DROP CONSTRAINT "FK_class_schedule_class"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_class_schedule_active"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_class_schedule_weekday"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_class_schedule_class_id"
    `);

    // Drop class_schedule table
    await queryRunner.query(`
      DROP TABLE "class_schedule"
    `);

    // Drop weekday enum
    await queryRunner.query(`
      DROP TYPE "public"."weekday_enum"
    `);

    // Remove timezone column from class table
    await queryRunner.query(`
      ALTER TABLE "class" 
      DROP COLUMN "timezone"
    `);

    // Make legacy fields required again
    await queryRunner.query(`
      ALTER TABLE "class" 
      ALTER COLUMN "weekdays" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "class" 
      ALTER COLUMN "timing" SET NOT NULL
    `);
  }
}
