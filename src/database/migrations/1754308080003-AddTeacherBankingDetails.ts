import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherBankingDetails1754308080003
  implements MigrationInterface
{
  name = 'AddTeacherBankingDetails1754308080003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teacher"
      ADD COLUMN "payoutMethod" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      ADD COLUMN "bankName" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      ADD COLUMN "accountNumber" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      ADD COLUMN "bankCode" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      ADD COLUMN "iban" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      ADD COLUMN "accountHolderName" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      ADD COLUMN "bankBranch" varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teacher"
      DROP COLUMN "bankBranch"
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      DROP COLUMN "accountHolderName"
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      DROP COLUMN "iban"
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      DROP COLUMN "bankCode"
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      DROP COLUMN "accountNumber"
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      DROP COLUMN "bankName"
    `);
    await queryRunner.query(`
      ALTER TABLE "teacher"
      DROP COLUMN "payoutMethod"
    `);
  }
}
