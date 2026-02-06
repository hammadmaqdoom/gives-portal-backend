import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddB2StorageToSettings1769200000000
  implements MigrationInterface
{
  name = 'AddB2StorageToSettings1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add B2 storage columns if not already present
    await queryRunner.query(`
      ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "b2EndpointUrl" varchar(500),
      ADD COLUMN IF NOT EXISTS "b2Region" varchar(100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "settings"
      DROP COLUMN IF EXISTS "b2Region",
      DROP COLUMN IF EXISTS "b2EndpointUrl"
    `);
  }
}
