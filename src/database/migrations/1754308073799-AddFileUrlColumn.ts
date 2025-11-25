import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileUrlColumn1754308073799 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD COLUMN "url" varchar(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "files" 
      DROP COLUMN "url"
    `);
  }
}
