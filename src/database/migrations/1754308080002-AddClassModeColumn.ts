import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClassModeColumn1754308080002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "class" 
      ADD COLUMN IF NOT EXISTS "classMode" varchar(20) DEFAULT 'virtual' CHECK ("classMode" IN ('virtual', 'in-person'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "class" 
      DROP COLUMN "classMode"
    `);
  }
}
