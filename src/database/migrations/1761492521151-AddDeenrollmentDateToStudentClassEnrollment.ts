import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeenrollmentDateToStudentClassEnrollment1761492521151
  implements MigrationInterface
{
  name = 'AddDeenrollmentDateToStudentClassEnrollment1761492521151';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deenrollment date column to student class enrollment table
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD "deenrollmentDate" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove deenrollment date column from student class enrollment table
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP COLUMN "deenrollmentDate"`,
    );
  }
}
