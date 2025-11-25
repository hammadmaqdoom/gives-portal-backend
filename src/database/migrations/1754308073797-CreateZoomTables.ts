import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZoomTables1754308073797 implements MigrationInterface {
  name = 'CreateZoomTables1754308073797';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create zoom_meetings_status_enum first
    await queryRunner.query(`
      CREATE TYPE "public"."zoom_meetings_status_enum" AS ENUM('scheduled', 'active', 'ended', 'cancelled')
    `);

    // Create zoom_credentials table
    await queryRunner.query(`
      CREATE TABLE "zoom_credentials" (
        "id" SERIAL NOT NULL,
        "teacher_id" integer NOT NULL,
        "zoom_api_key" text NOT NULL,
        "zoom_api_secret" text NOT NULL,
        "zoom_account_id" text NOT NULL,
        "zoom_webhook_secret" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_zoom_credentials_id" PRIMARY KEY ("id")
      )
    `);

    // Create zoom_meetings table
    await queryRunner.query(`
      CREATE TABLE "zoom_meetings" (
        "id" SERIAL NOT NULL,
        "class_id" integer NOT NULL,
        "teacher_id" integer NOT NULL,
        "meeting_id" character varying NOT NULL,
        "meeting_password" character varying NOT NULL,
        "meeting_url" text NOT NULL,
        "topic" text NOT NULL,
        "start_time" TIMESTAMP NOT NULL,
        "end_time" TIMESTAMP NOT NULL,
        "duration" integer NOT NULL,
        "status" "public"."zoom_meetings_status_enum" NOT NULL DEFAULT 'scheduled',
        "settings" jsonb NOT NULL,
        "participants" integer array NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_zoom_meetings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_zoom_meetings_meeting_id" UNIQUE ("meeting_id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "zoom_credentials" 
      ADD CONSTRAINT "FK_zoom_credentials_teacher_id" 
      FOREIGN KEY ("teacher_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "zoom_meetings" 
      ADD CONSTRAINT "FK_zoom_meetings_class_id" 
      FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "zoom_meetings" 
      ADD CONSTRAINT "FK_zoom_meetings_teacher_id" 
      FOREIGN KEY ("teacher_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_zoom_credentials_teacher_id" ON "zoom_credentials" ("teacher_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_zoom_meetings_class_id" ON "zoom_meetings" ("class_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_zoom_meetings_teacher_id" ON "zoom_meetings" ("teacher_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_zoom_meetings_status" ON "zoom_meetings" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_zoom_meetings_start_time" ON "zoom_meetings" ("start_time")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "zoom_meetings" DROP CONSTRAINT "FK_zoom_meetings_teacher_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "zoom_meetings" DROP CONSTRAINT "FK_zoom_meetings_class_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "zoom_credentials" DROP CONSTRAINT "FK_zoom_credentials_teacher_id"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_zoom_meetings_start_time"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_zoom_meetings_status"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_zoom_meetings_teacher_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_zoom_meetings_class_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_zoom_credentials_teacher_id"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "zoom_meetings"`);
    await queryRunner.query(`DROP TABLE "zoom_credentials"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "public"."zoom_meetings_status_enum"`);
  }
}
