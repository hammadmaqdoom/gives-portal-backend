import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSubjectFeeColumn1754308080001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subject" 
      DROP COLUMN "defaultFee"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subject" 
      ADD COLUMN "defaultFee" decimal(10,2) DEFAULT 0
    `);
  }
}
