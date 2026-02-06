import { MigrationInterface, QueryRunner } from 'typeorm';
import * as crypto from 'crypto';

export class AddDisableDevToolSettings1769180444000
  implements MigrationInterface
{
  name = 'AddDisableDevToolSettings1769180444000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists
    const hasTable = await queryRunner.hasTable('settings');

    if (hasTable) {
      // Add disable-devtool columns one by one to handle cases where some may already exist
      const columns = [
        {
          name: 'disableDevToolMd5',
          definition: 'character varying(255)',
        },
        {
          name: 'disableDevToolTkName',
          definition: "character varying(50) DEFAULT 'ddtk'",
        },
        {
          name: 'disableDevToolUrl',
          definition: 'character varying(500)',
        },
        {
          name: 'disableDevToolDetectors',
          definition: 'character varying(100)',
        },
        {
          name: 'disableDevToolInterval',
          definition: 'integer DEFAULT 200',
        },
        {
          name: 'disableDevToolClearLog',
          definition: 'boolean DEFAULT false',
        },
        {
          name: 'blockCopy',
          definition: 'boolean DEFAULT false',
        },
        {
          name: 'blockCut',
          definition: 'boolean DEFAULT false',
        },
        {
          name: 'blockPaste',
          definition: 'boolean DEFAULT false',
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

      // Generate MD5 hash for developer bypass
      // Using a combination of timestamp and random string for uniqueness
      const secretKey = `lms-dev-tool-bypass-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
      const md5Hash = crypto.createHash('md5').update(secretKey).digest('hex');

      // Check if blockDevTools column exists (from earlier migration)
      const hasBlockDevToolsColumn = await queryRunner.hasColumn('settings', 'blockDevTools');

      // Update all existing settings records to enable dev tools protection
      // and set the auto-generated hash
      if (hasBlockDevToolsColumn) {
        await queryRunner.query(`
          UPDATE "settings"
          SET 
            "blockDevTools" = true,
            "disableDevToolMd5" = $1,
            "disableDevToolTkName" = COALESCE("disableDevToolTkName", 'ddtk'),
            "disableDevToolInterval" = COALESCE("disableDevToolInterval", 200),
            "disableDevToolClearLog" = COALESCE("disableDevToolClearLog", false),
            "blockCopy" = COALESCE("blockCopy", false),
            "blockCut" = COALESCE("blockCut", false),
            "blockPaste" = COALESCE("blockPaste", false)
          WHERE "disableDevToolMd5" IS NULL OR "blockDevTools" = false
        `, [md5Hash]);
      } else {
        // If blockDevTools column doesn't exist, just set the hash
        await queryRunner.query(`
          UPDATE "settings"
          SET 
            "disableDevToolMd5" = $1,
            "disableDevToolTkName" = COALESCE("disableDevToolTkName", 'ddtk'),
            "disableDevToolInterval" = COALESCE("disableDevToolInterval", 200),
            "disableDevToolClearLog" = COALESCE("disableDevToolClearLog", false),
            "blockCopy" = COALESCE("blockCopy", false),
            "blockCut" = COALESCE("blockCut", false),
            "blockPaste" = COALESCE("blockPaste", false)
          WHERE "disableDevToolMd5" IS NULL
        `, [md5Hash]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('settings');

    if (hasTable) {
      const columns = [
        'disableDevToolMd5',
        'disableDevToolTkName',
        'disableDevToolUrl',
        'disableDevToolDetectors',
        'disableDevToolInterval',
        'disableDevToolClearLog',
        'blockCopy',
        'blockCut',
        'blockPaste',
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
