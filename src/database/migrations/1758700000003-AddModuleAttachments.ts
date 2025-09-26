import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddModuleAttachments1758700000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('learning_module');
    const has = table?.columns.find((c) => c.name === 'attachments');
    if (!has) {
      await queryRunner.addColumn(
        'learning_module',
        new TableColumn({ name: 'attachments', type: 'jsonb', isNullable: true }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('learning_module');
    const has = table?.columns.find((c) => c.name === 'attachments');
    if (has) {
      await queryRunner.dropColumn('learning_module', 'attachments');
    }
  }
}


