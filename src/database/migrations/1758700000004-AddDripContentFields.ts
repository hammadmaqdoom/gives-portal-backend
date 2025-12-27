import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDripContentFields1758700000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist before adding them
    const learningModuleTable = await queryRunner.getTable('learning_module');
    const classTable = await queryRunner.getTable('class');

    // Add drip content fields to learning_module table
    if (!learningModuleTable?.columns.find((c) => c.name === 'drip_enabled')) {
      await queryRunner.addColumn(
        'learning_module',
        new TableColumn({
          name: 'drip_enabled',
          type: 'boolean',
          default: false,
        }),
      );
    }

    if (!learningModuleTable?.columns.find((c) => c.name === 'drip_release_date')) {
      await queryRunner.addColumn(
        'learning_module',
        new TableColumn({
          name: 'drip_release_date',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    if (!learningModuleTable?.columns.find((c) => c.name === 'drip_prerequisites')) {
      await queryRunner.addColumn(
        'learning_module',
        new TableColumn({
          name: 'drip_prerequisites',
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }

    if (!learningModuleTable?.columns.find((c) => c.name === 'drip_delay_days')) {
      await queryRunner.addColumn(
        'learning_module',
        new TableColumn({
          name: 'drip_delay_days',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    // Add drip content toggle to class table
    if (!classTable?.columns.find((c) => c.name === 'drip_content_enabled')) {
      await queryRunner.addColumn(
        'class',
        new TableColumn({
          name: 'drip_content_enabled',
          type: 'boolean',
          default: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove drip content fields from learning_module table
    await queryRunner.dropColumn('learning_module', 'drip_delay_days');
    await queryRunner.dropColumn('learning_module', 'drip_prerequisites');
    await queryRunner.dropColumn('learning_module', 'drip_release_date');
    await queryRunner.dropColumn('learning_module', 'drip_enabled');

    // Remove drip content toggle from class table
    await queryRunner.dropColumn('class', 'drip_content_enabled');
  }
}
