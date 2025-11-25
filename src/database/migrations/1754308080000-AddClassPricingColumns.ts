import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClassPricingColumns1754308080000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "class" 
      ADD COLUMN "feeUSD" decimal(10,2) DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "class" 
      ADD COLUMN "feePKR" decimal(10,2) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "class" 
      DROP COLUMN "feeUSD"
    `);

    await queryRunner.query(`
      ALTER TABLE "class" 
      DROP COLUMN "feePKR"
    `);
  }
}
