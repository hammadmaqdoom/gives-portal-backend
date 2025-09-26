import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCurrencyRateTable1758700000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const has = await queryRunner.hasTable('currency_rate');
    if (!has) {
      await queryRunner.createTable(
        new Table({
          name: 'currency_rate',
          columns: [
            { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
            { name: 'date', type: 'date' },
            { name: 'base', type: 'varchar', length: '3' },
            { name: 'timestamp', type: 'bigint', isNullable: true },
            { name: 'provider', type: 'varchar', length: '64', default: `'openexchangerates'` },
            { name: 'rates', type: 'jsonb' },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
            { name: 'updatedAt', type: 'timestamp', default: 'now()' },
          ],
          uniques: [{ name: 'UQ_currency_rate_date_base', columnNames: ['date', 'base'] }],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const has = await queryRunner.hasTable('currency_rate');
    if (has) {
      await queryRunner.dropTable('currency_rate');
    }
  }
}


