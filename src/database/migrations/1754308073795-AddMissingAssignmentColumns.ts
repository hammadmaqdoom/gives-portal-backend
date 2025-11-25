import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingAssignmentColumns1754308073795
  implements MigrationInterface
{
  name = 'AddMissingAssignmentColumns1754308073795';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if status column exists, if not add it
    const statusExists = await queryRunner.hasColumn('assignment', 'status');
    if (!statusExists) {
      await queryRunner.query(`
        ALTER TABLE "assignment" 
        ADD COLUMN "status" character varying DEFAULT 'draft'
      `);
    }

    // Check if markingCriteria column exists, if not add it
    const markingCriteriaExists = await queryRunner.hasColumn(
      'assignment',
      'markingCriteria',
    );
    if (!markingCriteriaExists) {
      await queryRunner.query(`
        ALTER TABLE "assignment" 
        ADD COLUMN "markingCriteria" text
      `);
    }

    // Check if attachments column exists, if not add it
    const attachmentsExists = await queryRunner.hasColumn(
      'assignment',
      'attachments',
    );
    if (!attachmentsExists) {
      await queryRunner.query(`
        ALTER TABLE "assignment" 
        ADD COLUMN "attachments" text[]
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the columns if they exist
    const statusExists = await queryRunner.hasColumn('assignment', 'status');
    if (statusExists) {
      await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "status"`);
    }

    const markingCriteriaExists = await queryRunner.hasColumn(
      'assignment',
      'markingCriteria',
    );
    if (markingCriteriaExists) {
      await queryRunner.query(
        `ALTER TABLE "assignment" DROP COLUMN "markingCriteria"`,
      );
    }

    const attachmentsExists = await queryRunner.hasColumn(
      'assignment',
      'attachments',
    );
    if (attachmentsExists) {
      await queryRunner.query(
        `ALTER TABLE "assignment" DROP COLUMN "attachments"`,
      );
    }
  }
}
