import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddLearningModuleSections1758700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create section table
    await queryRunner.createTable(
      new Table({
        name: 'learning_module_section',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'title', type: 'varchar' },
          { name: 'orderIndex', type: 'int', default: 0 },
          { name: 'classId', type: 'int', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          { name: 'deletedAt', type: 'timestamp', isNullable: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'learning_module_section',
      new TableForeignKey({
        columnNames: ['classId'],
        referencedTableName: 'class',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add sectionId to learning_module
    const hasSectionId = (
      await queryRunner.getTable('learning_module')
    )?.columns.find((c) => c.name === 'sectionId');
    if (!hasSectionId) {
      await queryRunner.addColumn(
        'learning_module',
        new TableColumn({ name: 'sectionId', type: 'int', isNullable: true }),
      );
      await queryRunner.createForeignKey(
        'learning_module',
        new TableForeignKey({
          columnNames: ['sectionId'],
          referencedTableName: 'learning_module_section',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const lmTable = await queryRunner.getTable('learning_module');
    const fk = lmTable?.foreignKeys.find((f) =>
      f.columnNames.includes('sectionId'),
    );
    if (fk) {
      await queryRunner.dropForeignKey('learning_module', fk);
    }
    const hasSectionId = lmTable?.columns.find((c) => c.name === 'sectionId');
    if (hasSectionId) {
      await queryRunner.dropColumn('learning_module', 'sectionId');
    }

    const sectionTable = await queryRunner.getTable('learning_module_section');
    if (sectionTable) {
      for (const f of sectionTable.foreignKeys) {
        await queryRunner.dropForeignKey('learning_module_section', f);
      }
      await queryRunner.dropTable('learning_module_section');
    }
  }
}
