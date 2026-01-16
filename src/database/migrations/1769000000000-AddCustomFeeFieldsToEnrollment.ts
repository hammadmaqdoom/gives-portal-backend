import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomFeeFieldsToEnrollment1769000000000
  implements MigrationInterface
{
  name = 'AddCustomFeeFieldsToEnrollment1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add customFeePKR column to student class enrollment table
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD COLUMN IF NOT EXISTS "customFeePKR" DECIMAL(10,2)`,
    );

    // Add customFeeUSD column to student class enrollment table
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD COLUMN IF NOT EXISTS "customFeeUSD" DECIMAL(10,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove customFeeUSD column from student class enrollment table
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP COLUMN "customFeeUSD"`,
    );

    // Remove customFeePKR column from student class enrollment table
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP COLUMN "customFeePKR"`,
    );
  }
}
