import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAssignmentAttachmentsColumn1759389012952
  implements MigrationInterface
{
  name = 'UpdateAssignmentAttachmentsColumn1759389012952';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change the attachments column from simple-array to text array
    await queryRunner.query(
      `ALTER TABLE "assignment" ALTER COLUMN "attachments" TYPE text[] USING "attachments"::text[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to simple-array
    await queryRunner.query(
      `ALTER TABLE "assignment" ALTER COLUMN "attachments" TYPE text USING array_to_string("attachments", ',')`,
    );
  }
}
