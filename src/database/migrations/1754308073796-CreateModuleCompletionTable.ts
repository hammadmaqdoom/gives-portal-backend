import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateModuleCompletionTable1754308073796
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('module_completion');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'module_completion',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'student_id',
              type: 'int',
              isNullable: false,
            },
            {
              name: 'module_id',
              type: 'int',
              isNullable: false,
            },
            {
              name: 'is_completed',
              type: 'boolean',
              default: false,
              isNullable: false,
            },
            {
              name: 'completed_at',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
        }),
        true,
      );

      // Add unique constraint to prevent duplicate entries
      await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'UQ_student_module'
          ) THEN
            ALTER TABLE module_completion ADD CONSTRAINT UQ_student_module UNIQUE (student_id, module_id);
          END IF;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('module_completion');
  }
}
