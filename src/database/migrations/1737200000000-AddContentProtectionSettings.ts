import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentProtectionSettings1737200000000
  implements MigrationInterface
{
  name = 'AddContentProtectionSettings1737200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists
    const hasTable = await queryRunner.hasTable('settings');

    if (hasTable) {
      // Add content protection columns one by one to handle cases where some may already exist
      const columns = [
        {
          name: 'contentProtectionEnabled',
          definition: 'boolean DEFAULT false',
        },
        { name: 'blockDevTools', definition: 'boolean DEFAULT false' },
        { name: 'blockKeyboardShortcuts', definition: 'boolean DEFAULT true' },
        { name: 'blockRightClick', definition: 'boolean DEFAULT true' },
        { name: 'blockTextSelection', definition: 'boolean DEFAULT true' },
        {
          name: 'protectionAction',
          definition: "character varying(20) DEFAULT 'warn'",
        },
        { name: 'watermarkEnabled', definition: 'boolean DEFAULT false' },
        {
          name: 'watermarkShowInstitution',
          definition: 'boolean DEFAULT true',
        },
        { name: 'watermarkShowInstructor', definition: 'boolean DEFAULT true' },
        {
          name: 'watermarkShowStudentEmail',
          definition: 'boolean DEFAULT true',
        },
        { name: 'watermarkShowStudentId', definition: 'boolean DEFAULT false' },
        { name: 'watermarkOpacity', definition: 'decimal(3,2) DEFAULT 0.4' },
        {
          name: 'watermarkPosition',
          definition: "character varying(20) DEFAULT 'random'",
        },
      ];

      for (const col of columns) {
        try {
          const hasColumn = await queryRunner.hasColumn('settings', col.name);
          if (!hasColumn) {
            await queryRunner.query(
              `ALTER TABLE "settings" ADD COLUMN "${col.name}" ${col.definition}`,
            );
          }
        } catch (e) {
          // Column might already exist, ignore error
          console.log(`Column ${col.name} may already exist, skipping...`);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('settings');

    if (hasTable) {
      const columns = [
        'contentProtectionEnabled',
        'blockDevTools',
        'blockKeyboardShortcuts',
        'blockRightClick',
        'blockTextSelection',
        'protectionAction',
        'watermarkEnabled',
        'watermarkShowInstitution',
        'watermarkShowInstructor',
        'watermarkShowStudentEmail',
        'watermarkShowStudentId',
        'watermarkOpacity',
        'watermarkPosition',
      ];

      for (const colName of columns) {
        try {
          const hasColumn = await queryRunner.hasColumn('settings', colName);
          if (hasColumn) {
            await queryRunner.query(
              `ALTER TABLE "settings" DROP COLUMN "${colName}"`,
            );
          }
        } catch (e) {
          console.log(`Column ${colName} may not exist, skipping...`);
        }
      }
    }
  }
}
