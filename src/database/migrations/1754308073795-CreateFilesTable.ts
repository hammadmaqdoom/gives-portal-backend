import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFilesTable1754308073795 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('files');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'files',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'filename',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'originalName',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'path',
              type: 'varchar',
              length: '500',
              isNullable: false,
            },
            {
              name: 'size',
              type: 'bigint',
              isNullable: false,
            },
            {
              name: 'mimeType',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            {
              name: 'uploadedBy',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'uploadedAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'contextType',
              type: 'varchar',
              length: '50',
              isNullable: false,
              comment: 'assignment, submission, module',
            },
            {
              name: 'contextId',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'deletedAt',
              type: 'timestamp',
              isNullable: true,
            },
          ],
          indices: [
            {
              name: 'IDX_FILES_CONTEXT',
              columnNames: ['contextType', 'contextId'],
            },
            {
              name: 'IDX_FILES_UPLOADED_BY',
              columnNames: ['uploadedBy'],
            },
            {
              name: 'IDX_FILES_UPLOADED_AT',
              columnNames: ['uploadedAt'],
            },
          ],
          // Foreign key constraint removed temporarily - users table may not exist yet
          // foreignKeys: [
          //   {
          //     name: 'FK_FILES_UPLOADED_BY',
          //     columnNames: ['uploadedBy'],
          //     referencedTableName: 'users',
          //     referencedColumnNames: ['id'],
          //     onDelete: 'CASCADE',
          //   },
          // ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('files');
  }
}
