import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperAdminRole1780000000000 implements MigrationInterface {
  name = 'AddSuperAdminRole1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add SuperAdmin role
    await queryRunner.query(`
      INSERT INTO "role" (id, name) 
      VALUES (4, 'SuperAdmin')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Update existing admin@digitaro.co user to super admin role
    await queryRunner.query(`
      UPDATE "user" 
      SET "roleId" = 4 
      WHERE email = 'admin@digitaro.co' AND "roleId" != 4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert admin@digitaro.co back to regular admin
    await queryRunner.query(`
      UPDATE "user" 
      SET "roleId" = 1 
      WHERE email = 'admin@digitaro.co' AND "roleId" = 4;
    `);

    // Note: We don't delete the SuperAdmin role as it might be used elsewhere
    // If needed, manually delete: DELETE FROM "role" WHERE id = 4;
  }
}
