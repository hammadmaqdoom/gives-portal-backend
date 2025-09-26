import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStateColumnsToStudentAndParent1757310000000
  implements MigrationInterface
{
  name = 'AddStateColumnsToStudentAndParent1757310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add state column to student
    await queryRunner.query(
      `ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "state" varchar`,
    );
    // Add state column to parent
    await queryRunner.query(
      `ALTER TABLE "parent" ADD COLUMN IF NOT EXISTS "state" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "parent" DROP COLUMN IF EXISTS "state"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN IF EXISTS "state"`,
    );
  }
}
