import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFilesUploadedByColumn1754308073798
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change uploadedBy column from uuid to varchar
    await queryRunner.query(`
      ALTER TABLE "files" 
      ALTER COLUMN "uploadedBy" TYPE varchar(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to uuid type
    await queryRunner.query(`
      ALTER TABLE "files" 
      ALTER COLUMN "uploadedBy" TYPE uuid USING uploadedBy::uuid
    `);
  }
}
