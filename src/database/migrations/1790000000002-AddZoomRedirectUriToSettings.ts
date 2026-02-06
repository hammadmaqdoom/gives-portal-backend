import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddZoomRedirectUriToSettings1790000000002
  implements MigrationInterface
{
  name = 'AddZoomRedirectUriToSettings1790000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing zoomRedirectUri column that was omitted from the previous migration
    const table = await queryRunner.getTable('settings');

    if (table && !table.findColumnByName('zoomRedirectUri')) {
      await queryRunner.query(`
        ALTER TABLE "settings"
        ADD COLUMN "zoomRedirectUri" character varying(500)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('settings');

    if (table && table.findColumnByName('zoomRedirectUri')) {
      await queryRunner.query(`
        ALTER TABLE "settings" DROP COLUMN "zoomRedirectUri"
      `);
    }
  }
}
