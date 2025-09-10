import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchoolEntities1715028537218 implements MigrationInterface {
  name = 'CreateSchoolEntities1715028537218';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create parents table
    await queryRunner.query(
      `CREATE TABLE "parent" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying, "phone" character varying, "passcode" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_21f5b4c1c8c4c8c4c8c4c8c4c8c" PRIMARY KEY ("id"))`,
    );

    // Create subjects table
    await queryRunner.query(
      `CREATE TABLE "subject" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "defaultFee" decimal(10,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_22f5b4c1c8c4c8c4c8c4c8c4c8c" PRIMARY KEY ("id"))`,
    );

    // Create teachers table
    await queryRunner.query(
      `CREATE TABLE "teacher" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying, "phone" character varying, "commissionPercentage" decimal(5,2) NOT NULL DEFAULT '0', "subjectsAllowed" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_23f5b4c1c8c4c8c4c8c4c8c4c8c" PRIMARY KEY ("id"))`,
    );

    // Create classes table
    await queryRunner.query(
      `CREATE TABLE "class" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "subjectId" integer, "teacherId" integer, "batchTerm" character varying NOT NULL, "weekdays" jsonb, "timing" character varying NOT NULL, "courseOutline" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_24f5b4c1c8c4c8c4c8c4c8c4c8c" PRIMARY KEY ("id"))`,
    );

    // Create students table
    await queryRunner.query(
      `CREATE TABLE "student" ("id" SERIAL NOT NULL, "studentId" character varying NOT NULL, "name" character varying NOT NULL, "address" character varying, "contact" character varying, "photoId" uuid, "classId" integer, "parentId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_student_student_id" UNIQUE ("studentId"), CONSTRAINT "PK_25f5b4c1c8c4c8c4c8c4c8c4c8c" PRIMARY KEY ("id"))`,
    );

    // Create attendance table
    await queryRunner.query(
      `CREATE TABLE "attendance" ("id" SERIAL NOT NULL, "date" date NOT NULL, "studentId" integer, "classId" integer, "status" character varying NOT NULL DEFAULT 'Present', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_26f5b4c1c8c4c8c4c8c4c8c4c8c" PRIMARY KEY ("id"))`,
    );

    // Create assignments table
    await queryRunner.query(
      `CREATE TABLE "assignment" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "dueDate" TIMESTAMP, "type" character varying NOT NULL DEFAULT 'assignment', "classId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_27f5b4c1c8c4c8c4c8c4c8c4c8c" PRIMARY KEY ("id"))`,
    );

    // Create student_performance table
    await queryRunner.query(
      `CREATE TABLE "student_performance" ("id" SERIAL NOT NULL, "studentId" integer, "assignmentId" integer, "grade" character varying, "instructorComments" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_28f5b4c1c8c4c8c4c8c4c8c4c8c" PRIMARY KEY ("id"))`,
    );

    // Create fees table
    await queryRunner.query(
      `CREATE TABLE "fee" ("id" SERIAL NOT NULL, "studentId" integer, "classId" integer, "amount" decimal(10,2) NOT NULL, "paymentStatus" character varying NOT NULL DEFAULT 'Unpaid', "paymentMethod" character varying, "transactionId" character varying, "dueDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_29f5b4c1c8c4c8c4c8c4c8c4c8c" PRIMARY KEY ("id"))`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_class_subject" FOREIGN KEY ("subjectId") REFERENCES "subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_class_teacher" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_student_photo" FOREIGN KEY ("photoId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_student_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_student_parent" FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_assignment_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_performance" ADD CONSTRAINT "FK_student_performance_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_performance" ADD CONSTRAINT "FK_student_performance_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ADD CONSTRAINT "FK_fee_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ADD CONSTRAINT "FK_fee_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_parent_email" ON "parent" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parent_phone" ON "parent" ("phone")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_student_student_id" ON "student" ("studentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_student_name" ON "student" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_teacher_email" ON "teacher" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subject_name" ON "subject" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_name" ON "class" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_date" ON "attendance" ("date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_student_date" ON "attendance" ("studentId", "date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fee_payment_status" ON "fee" ("paymentStatus")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "fee" DROP CONSTRAINT "FK_fee_class"`);
    await queryRunner.query(
      `ALTER TABLE "fee" DROP CONSTRAINT "FK_fee_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_performance" DROP CONSTRAINT "FK_student_performance_assignment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_performance" DROP CONSTRAINT "FK_student_performance_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_assignment_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "FK_student_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "FK_student_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "FK_student_photo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_class_teacher"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_class_subject"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_fee_payment_status"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_student_date"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_date"`);
    await queryRunner.query(`DROP INDEX "IDX_class_name"`);
    await queryRunner.query(`DROP INDEX "IDX_subject_name"`);
    await queryRunner.query(`DROP INDEX "IDX_teacher_email"`);
    await queryRunner.query(`DROP INDEX "IDX_student_name"`);
    await queryRunner.query(`DROP INDEX "IDX_student_student_id"`);
    await queryRunner.query(`DROP INDEX "IDX_parent_phone"`);
    await queryRunner.query(`DROP INDEX "IDX_parent_email"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "fee"`);
    await queryRunner.query(`DROP TABLE "student_performance"`);
    await queryRunner.query(`DROP TABLE "assignment"`);
    await queryRunner.query(`DROP TABLE "attendance"`);
    await queryRunner.query(`DROP TABLE "student"`);
    await queryRunner.query(`DROP TABLE "class"`);
    await queryRunner.query(`DROP TABLE "teacher"`);
    await queryRunner.query(`DROP TABLE "subject"`);
    await queryRunner.query(`DROP TABLE "parent"`);
  }
}
