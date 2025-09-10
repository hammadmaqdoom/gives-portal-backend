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

    await queryRunner.createForeignKey(
      'learning_module',
      new TableForeignKey({
        columnNames: ['classId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'class',
        onDelete: 'SET NULL',
      }),
    );

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

    await queryRunner.createForeignKey(
      'announcement',
      new TableForeignKey({
        columnNames: ['classId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'class',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('announcement', true);
    await queryRunner.dropTable('learning_module', true);
  }
}
