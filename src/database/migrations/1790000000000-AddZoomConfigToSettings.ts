import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddZoomConfigToSettings1790000000000
  implements MigrationInterface
{
  name = 'AddZoomConfigToSettings1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding
    const table = await queryRunner.getTable('settings');

    if (table && !table.findColumnByName('zoomClientId')) {
      await queryRunner.query(`
        ALTER TABLE "settings"
        ADD COLUMN "zoomClientId" character varying(255)
      `);
    }

    if (table && !table.findColumnByName('zoomClientSecret')) {
      await queryRunner.query(`
        ALTER TABLE "settings"
        ADD COLUMN "zoomClientSecret" character varying(255)
      `);
    }

    if (table && !table.findColumnByName('zoomAdminAccess')) {
      await queryRunner.query(`
        ALTER TABLE "settings"
        ADD COLUMN "zoomAdminAccess" boolean DEFAULT false
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('settings');

    if (table && table.findColumnByName('zoomAdminAccess')) {
      await queryRunner.query(`
        ALTER TABLE "settings" DROP COLUMN "zoomAdminAccess"
      `);
    }

    if (table && table.findColumnByName('zoomClientSecret')) {
      await queryRunner.query(`
        ALTER TABLE "settings" DROP COLUMN "zoomClientSecret"
      `);
    }

    if (table && table.findColumnByName('zoomClientId')) {
      await queryRunner.query(`
        ALTER TABLE "settings" DROP COLUMN "zoomClientId"
      `);
    }
  }
}
