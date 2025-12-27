import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateModulesAndAnnouncements1719990000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if learning_module table exists
    const learningModuleExists = await queryRunner.hasTable('learning_module');
    if (!learningModuleExists) {
      await queryRunner.createTable(
        new Table({
          name: 'learning_module',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'title', type: 'varchar', isNullable: false },
            { name: 'contentHtml', type: 'text', isNullable: true },
            { name: 'orderIndex', type: 'int', default: 0 },
            { name: 'groupId', type: 'int', isNullable: true },
            { name: 'videoUrl', type: 'varchar', isNullable: true },
            { name: 'classId', type: 'int', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
            { name: 'updatedAt', type: 'timestamp', default: 'now()' },
            { name: 'deletedAt', type: 'timestamp', isNullable: true },
          ],
        }),
      );
    }

    // Add foreign key if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'FK_learning_module_class'
        ) THEN
          ALTER TABLE "learning_module" 
          ADD CONSTRAINT "FK_learning_module_class" 
          FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Check if announcement table exists
    const announcementExists = await queryRunner.hasTable('announcement');
    if (!announcementExists) {
      await queryRunner.createTable(
        new Table({
          name: 'announcement',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'title', type: 'varchar', isNullable: false },
            { name: 'bodyHtml', type: 'text', isNullable: true },
            { name: 'pinned', type: 'boolean', default: false },
            { name: 'publishAt', type: 'timestamp', isNullable: true },
            { name: 'classId', type: 'int', isNullable: true },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
            { name: 'updatedAt', type: 'timestamp', default: 'now()' },
            { name: 'deletedAt', type: 'timestamp', isNullable: true },
          ],
        }),
      );
    }

    // Add foreign key if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'FK_announcement_class'
        ) THEN
          ALTER TABLE "announcement" 
          ADD CONSTRAINT "FK_announcement_class" 
          FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('announcement', true);
    await queryRunner.dropTable('learning_module', true);
  }
}
