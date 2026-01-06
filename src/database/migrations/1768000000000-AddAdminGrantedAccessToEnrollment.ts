import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminGrantedAccessToEnrollment1768000000000
  implements MigrationInterface
{
  name = 'AddAdminGrantedAccessToEnrollment1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add adminGrantedAccess column to student class enrollment table
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD COLUMN IF NOT EXISTS "adminGrantedAccess" BOOLEAN NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove adminGrantedAccess column from student class enrollment table
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP COLUMN "adminGrantedAccess"`,
    );
  }
}
