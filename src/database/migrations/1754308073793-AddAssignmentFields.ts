import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentFields1754308073793 implements MigrationInterface {
  name = 'AddAssignmentFields1754308073793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assignment" 
      ADD COLUMN "markingCriteria" text,
      ADD COLUMN "attachments" text[]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assignment" 
      DROP COLUMN "markingCriteria",
      DROP COLUMN "attachments"
    `);
  }
}
