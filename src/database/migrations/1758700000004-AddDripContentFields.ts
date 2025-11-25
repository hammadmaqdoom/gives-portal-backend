import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDripContentFields1758700000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add drip content fields to learning_module table
    await queryRunner.addColumn(
      'learning_module',
      new TableColumn({
        name: 'drip_enabled',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'learning_module',
      new TableColumn({
        name: 'drip_release_date',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'learning_module',
      new TableColumn({
        name: 'drip_prerequisites',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'learning_module',
      new TableColumn({
        name: 'drip_delay_days',
        type: 'int',
        isNullable: true,
      }),
    );

    // Add drip content toggle to class table
    await queryRunner.addColumn(
      'class',
      new TableColumn({
        name: 'drip_content_enabled',
        type: 'boolean',
        default: false,
      }),
    );
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
