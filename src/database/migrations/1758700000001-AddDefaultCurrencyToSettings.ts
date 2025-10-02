import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDefaultCurrencyToSettings1758700000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('settings');
    const hasCol = table?.columns.find((c) => c.name === 'defaultCurrency');
    if (!hasCol) {
      await queryRunner.addColumn(
        'settings',
        new TableColumn({
          name: 'defaultCurrency',
          type: 'varchar',
          length: '3',
          isNullable: true,
          default: `'PKR'`,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('settings');
    const hasCol = table?.columns.find((c) => c.name === 'defaultCurrency');
    if (hasCol) {
      await queryRunner.dropColumn('settings', 'defaultCurrency');
    }
  }
}
