import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddThemeColorFieldsToSettings1763000000000
  implements MigrationInterface
{
  name = 'AddThemeColorFieldsToSettings1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding
    const table = await queryRunner.getTable('settings');

    if (table && !table.findColumnByName('themeColorPreset')) {
      await queryRunner.query(`
        ALTER TABLE "settings"
        ADD COLUMN "themeColorPreset" character varying(50) DEFAULT 'brand'
      `);
    }

    if (table && !table.findColumnByName('themeCustomColor')) {
      await queryRunner.query(`
        ALTER TABLE "settings"
        ADD COLUMN "themeCustomColor" character varying(7)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('settings');

    if (table && table.findColumnByName('themeCustomColor')) {
      await queryRunner.query(`
        ALTER TABLE "settings" DROP COLUMN "themeCustomColor"
      `);
    }

    if (table && table.findColumnByName('themeColorPreset')) {
      await queryRunner.query(`
        ALTER TABLE "settings" DROP COLUMN "themeColorPreset"
      `);
    }
  }
}
