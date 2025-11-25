import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddZoomSupportToLearningModules1754308073798
  implements MigrationInterface
{
  name = 'AddZoomSupportToLearningModules1754308073798';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Zoom meeting support to learning modules
    await queryRunner.query(`
      ALTER TABLE "learning_module" 
      ADD COLUMN "is_pinned" boolean NOT NULL DEFAULT false,
      ADD COLUMN "zoom_meeting_id" integer,
      ADD COLUMN "zoom_meeting_url" text,
      ADD COLUMN "zoom_meeting_password" text,
      ADD COLUMN "zoom_meeting_start_time" TIMESTAMP,
      ADD COLUMN "zoom_meeting_duration" integer
    `);

    // Add foreign key constraint for zoom_meeting_id
    await queryRunner.query(`
      ALTER TABLE "learning_module" 
      ADD CONSTRAINT "FK_learning_module_zoom_meeting" 
      FOREIGN KEY ("zoom_meeting_id") 
      REFERENCES "zoom_meetings"("id") 
      ON DELETE SET NULL
    `);

    // Create index for pinned modules
    await queryRunner.query(`
      CREATE INDEX "IDX_learning_module_is_pinned" 
      ON "learning_module" ("is_pinned")
    `);

    // Create index for zoom meeting
    await queryRunner.query(`
      CREATE INDEX "IDX_learning_module_zoom_meeting" 
      ON "learning_module" ("zoom_meeting_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "learning_module" 
      DROP CONSTRAINT "FK_learning_module_zoom_meeting"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "learning_module" 
      DROP COLUMN "is_pinned",
      DROP COLUMN "zoom_meeting_id",
      DROP COLUMN "zoom_meeting_url",
      DROP COLUMN "zoom_meeting_password",
      DROP COLUMN "zoom_meeting_start_time",
      DROP COLUMN "zoom_meeting_duration"
    `);

    // Remove indexes
    await queryRunner.query(`
      DROP INDEX "IDX_learning_module_is_pinned"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_learning_module_zoom_meeting"
    `);
  }
}
