import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherRole1754308073792 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add teacher role
    await queryRunner.query(`
            INSERT INTO "role" ("id", "name") 
            VALUES (3, 'teacher') 
            ON CONFLICT (id) DO NOTHING
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove teacher role
    await queryRunner.query(`
            DELETE FROM "role" WHERE "id" = 3 AND "name" = 'teacher'
        `);
  }
}
