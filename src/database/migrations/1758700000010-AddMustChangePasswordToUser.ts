import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMustChangePasswordToUser1758700000010
  implements MigrationInterface
{
  name = 'AddMustChangePasswordToUser1758700000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "mustChangePassword"`,
    );
  }
}
