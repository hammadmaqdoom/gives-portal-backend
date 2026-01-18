import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddZoomConfigFeatureModule1790000000001
  implements MigrationInterface
{
  name = 'AddZoomConfigFeatureModule1790000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add Zoom Configuration to feature modules (settings tab)
    await queryRunner.query(`
      INSERT INTO "feature_modules" 
        (name, display_name, description, is_enabled, icon, category, module_type, sort_order)
      VALUES
        ('zoom_config', 'Zoom Configuration', 'Configure Zoom OAuth credentials and integration settings', false, 'solar:videocamera-bold-duotone', 'settings', 'settings_tab', 10)
      ON CONFLICT (name) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "feature_modules" WHERE name = 'zoom_config';
    `);
  }
}
