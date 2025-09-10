import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStudentAndParentEntities1715028537222
  implements MigrationInterface
{
  name = 'UpdateStudentAndParentEntities1715028537222';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Start transaction
    await queryRunner.startTransaction();

    try {
      // Update student table with new fields
      await queryRunner.query(
        `ALTER TABLE "student" ADD COLUMN "city" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "student" ADD COLUMN "country" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "student" ADD COLUMN "dateOfBirth" TIMESTAMP`,
      );
      await queryRunner.query(
        `ALTER TABLE "student" ADD COLUMN "email" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "student" ADD COLUMN "userId" integer`,
      );
      await queryRunner.query(
        `ALTER TABLE "student" ADD CONSTRAINT "FK_student_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );

      // Update parent table with new fields
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "fullName" character varying NOT NULL DEFAULT ''`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "mobile" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "landline" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "address" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "city" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "country" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "relationship" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "maritalStatus" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "userId" integer`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" ADD CONSTRAINT "FK_parent_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );

      // Create parent_student junction table
      await queryRunner.query(
        `CREATE TABLE "parent_student" (
          "id" SERIAL NOT NULL,
          "parentId" integer NOT NULL,
          "studentId" integer NOT NULL,
          "status" character varying NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "deletedAt" TIMESTAMP,
          CONSTRAINT "PK_parent_student" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_parent_student" UNIQUE ("parentId", "studentId")
        )`,
      );

      // Add foreign key constraints for parent_student table
      await queryRunner.query(
        `ALTER TABLE "parent_student" ADD CONSTRAINT "FK_parent_student_parent" 
         FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent_student" ADD CONSTRAINT "FK_parent_student_student" 
         FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );

      // Create indexes for parent_student table
      await queryRunner.query(
        `CREATE INDEX "IDX_parent_student_parent_id" ON "parent_student" ("parentId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_parent_student_student_id" ON "parent_student" ("studentId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_parent_student_status" ON "parent_student" ("status")`,
      );

      // Migrate existing parent data
      await queryRunner.query(
        `UPDATE "parent" SET "fullName" = "name" WHERE "fullName" = ''`,
      );
      await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN "name"`);

      // Migrate existing parent-student relationships
      await queryRunner.query(
        `INSERT INTO "parent_student" ("parentId", "studentId", "status")
         SELECT "parentId", "id", 'active'
         FROM "student" 
         WHERE "parentId" IS NOT NULL`,
      );

      // Remove old parentId column from student table
      await queryRunner.query(
        `ALTER TABLE "student" DROP CONSTRAINT "FK_student_parent"`,
      );
      await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "parentId"`);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Insert migration record
      await queryRunner.query(
        `INSERT INTO "migrations" ("timestamp", "name") VALUES (1715028537222, 'UpdateStudentAndParentEntities1715028537222')`,
      );
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Start transaction
    await queryRunner.startTransaction();

    try {
      // Add back parentId column to student table
      await queryRunner.query(
        `ALTER TABLE "student" ADD COLUMN "parentId" integer`,
      );
      await queryRunner.query(
        `ALTER TABLE "student" ADD CONSTRAINT "FK_student_parent" 
         FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );

      // Migrate data back from parent_student to student table
      await queryRunner.query(
        `UPDATE "student" SET "parentId" = (
           SELECT "parentId" 
           FROM "parent_student" 
           WHERE "studentId" = "student"."id" AND "status" = 'active' 
           ORDER BY "createdAt" ASC 
           LIMIT 1
         )`,
      );

      // Drop indexes for parent_student table
      await queryRunner.query(`DROP INDEX "IDX_parent_student_status"`);
      await queryRunner.query(`DROP INDEX "IDX_parent_student_student_id"`);
      await queryRunner.query(`DROP INDEX "IDX_parent_student_parent_id"`);

      // Drop foreign key constraints for parent_student table
      await queryRunner.query(
        `ALTER TABLE "parent_student" DROP CONSTRAINT "FK_parent_student_student"`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent_student" DROP CONSTRAINT "FK_parent_student_parent"`,
      );

      // Drop the parent_student table
      await queryRunner.query(`DROP TABLE "parent_student"`);

      // Revert parent table changes
      await queryRunner.query(
        `ALTER TABLE "parent" ADD COLUMN "name" character varying NOT NULL DEFAULT ''`,
      );
      await queryRunner.query(`UPDATE "parent" SET "name" = "fullName"`);
      await queryRunner.query(
        `ALTER TABLE "parent" DROP CONSTRAINT "FK_parent_user"`,
      );
      await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN "userId"`);
      await queryRunner.query(
        `ALTER TABLE "parent" DROP COLUMN "maritalStatus"`,
      );
      await queryRunner.query(
        `ALTER TABLE "parent" DROP COLUMN "relationship"`,
      );
      await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN "country"`);
      await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN "city"`);
      await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN "address"`);
      await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN "landline"`);
      await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN "mobile"`);
      await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN "fullName"`);

      // Revert student table changes
      await queryRunner.query(
        `ALTER TABLE "student" DROP CONSTRAINT "FK_student_user"`,
      );
      await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "userId"`);
      await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "email"`);
      await queryRunner.query(
        `ALTER TABLE "student" DROP COLUMN "dateOfBirth"`,
      );
      await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "country"`);
      await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "city"`);

      // Commit transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
}
