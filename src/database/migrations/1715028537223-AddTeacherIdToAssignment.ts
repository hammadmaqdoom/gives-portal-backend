import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherIdToAssignment1715028537223
  implements MigrationInterface
{
  name = 'AddTeacherIdToAssignment1715028537223';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add teacherId column to assignment table
    await queryRunner.query(`ALTER TABLE "assignment" ADD "teacherId" integer`);

    // Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_assignment_teacher" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Add index for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_teacher" ON "assignment" ("teacherId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_assignment_teacher"`);

    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_assignment_teacher"`,
    );

    // Drop column
    await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "teacherId"`);
  }
}
