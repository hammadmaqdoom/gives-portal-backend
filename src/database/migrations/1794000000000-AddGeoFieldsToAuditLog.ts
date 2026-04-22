import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGeoFieldsToAuditLog1794000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('audit_log', [
      new TableColumn({
        name: 'countryCode',
        type: 'varchar',
        length: '2',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'city',
        type: 'varchar',
        length: '100',
        isNullable: true,
        default: null,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('audit_log', 'city');
    await queryRunner.dropColumn('audit_log', 'countryCode');
  }
}
