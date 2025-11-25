import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTeacherSubjectsToIds1754303783834
  implements MigrationInterface
{
  name = 'UpdateTeacherSubjectsToIds1754303783834';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_class_subject"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_class_teacher"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP CONSTRAINT "FK_enrollment_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP CONSTRAINT "FK_enrollment_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" DROP CONSTRAINT "FK_parent_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" DROP CONSTRAINT "FK_parent_student_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" DROP CONSTRAINT "FK_parent_student_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "FK_student_photo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "FK_student_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_assignment_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" DROP CONSTRAINT "FK_performance_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" DROP CONSTRAINT "FK_performance_assignment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" DROP CONSTRAINT "FK_fee_student"`,
    );
    await queryRunner.query(`ALTER TABLE "fee" DROP CONSTRAINT "FK_fee_class"`);
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_class"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_subject_name"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_teacher_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_class_name"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_enrollment_student_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_enrollment_class_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_enrollment_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_parent_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_parent_phone"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_parent_student_parent_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_parent_student_student_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_parent_student_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_student_student_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_student_name"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_assignment_maxScore"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_performance_student"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_performance_assignment"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fee_student"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fee_class"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fee_dueDate"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fee_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fee_transactionId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fee_paymentMethod"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_attendance_date"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_attendance_student_date"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_attendance_notes"`);
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP CONSTRAINT "UQ_student_class_enrollment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" DROP CONSTRAINT "UQ_parent_student"`,
    );
    await queryRunner.query(`ALTER TABLE "parent" DROP COLUMN "phone"`);
    await queryRunner.query(
      `ALTER TABLE "teacher" ALTER COLUMN "subjectsAllowed" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ALTER COLUMN "weekdays" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "class" DROP COLUMN "courseOutline"`);
    await queryRunner.query(
      `ALTER TABLE "class" ADD "courseOutline" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" ALTER COLUMN "fullName" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" ALTER COLUMN "passcode" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" ADD CONSTRAINT "UQ_a51bd21a6e90dbe656ad65cab89" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "UQ_7829063e3cf13c3d684416bd258" UNIQUE ("photoId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "UQ_b35463776b4a11a3df3c30d920a" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ALTER COLUMN "dueDate" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."assignment_type_enum" AS ENUM('assignment', 'exam', 'quiz', 'project')`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD "type" "public"."assignment_type_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payment_status_enum" RENAME TO "payment_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fee_status_enum" AS ENUM('paid', 'unpaid', 'partial', 'overdue')`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ALTER COLUMN "status" TYPE "public"."fee_status_enum" USING "status"::"text"::"public"."fee_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payment_status_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payment_method_enum" RENAME TO "payment_method_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fee_paymentmethod_enum" AS ENUM('cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'online')`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ALTER COLUMN "paymentMethod" TYPE "public"."fee_paymentmethod_enum" USING "paymentMethod"::"text"::"public"."fee_paymentmethod_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payment_method_enum_old"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "date"`);
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD "date" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_status_enum" AS ENUM('present', 'absent', 'late', 'excused')`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD "status" "public"."attendance_status_enum" NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d011c391e37d9a5e63e8b04c97" ON "subject" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_00634394dce7677d531749ed8e" ON "teacher" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_574dd394846fb85d495d0f77df" ON "class" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ceca46c718304e67e2f53aa9f8" ON "student_class_enrollment" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a0c630e82ada8d515f3428590" ON "student_class_enrollment" ("classId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9d1178c9a42b795ced26189cb4" ON "parent" ("fullName") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d02ab296296bdb240e89b8786" ON "parent_student" ("parentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9aced16411bd7d56126c91f30c" ON "parent_student" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9316abc534487368cfd8527e8d" ON "student" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eead2cd6e5be2c86303b786bff" ON "student" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_046f3219d9796d57ae2af97cbe" ON "assignment" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_674b8ae9b331e1d8ff061330af" ON "assignment" ("dueDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1cdc45c1417ee1c3b47139d7d5" ON "performance" ("score") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ff6fb0cd4c46fe9df52cd1d16" ON "fee" ("amount") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e8f9696f072ec01056c50475ee" ON "fee" ("dueDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff05fd5159e6d9d99514d46531" ON "attendance" ("date") `,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD CONSTRAINT "UQ_0a8665cf674e0acb70c8034b080" UNIQUE ("studentId", "classId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" ADD CONSTRAINT "UQ_1047544e8ada23a7a77d31e6259" UNIQUE ("parentId", "studentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_c5c9cd873ffdefe494d331755a9" FOREIGN KEY ("subjectId") REFERENCES "subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_d3e7278501fe8c5e8cf2cf74be7" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD CONSTRAINT "FK_ceca46c718304e67e2f53aa9f8a" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD CONSTRAINT "FK_9a0c630e82ada8d515f34285902" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" ADD CONSTRAINT "FK_a51bd21a6e90dbe656ad65cab89" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" ADD CONSTRAINT "FK_3d02ab296296bdb240e89b8786d" FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" ADD CONSTRAINT "FK_9aced16411bd7d56126c91f30cd" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_7829063e3cf13c3d684416bd258" FOREIGN KEY ("photoId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_b35463776b4a11a3df3c30d920a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_06502a00f4ff25d2f52f236ac5a" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" ADD CONSTRAINT "FK_925fcb3ddd23b89763f6247a3ea" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" ADD CONSTRAINT "FK_69aa90c76978f30fe3d95dc22a2" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ADD CONSTRAINT "FK_38e5a5f9d352b462cd38da82df8" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ADD CONSTRAINT "FK_736f783d6ac6eb1f6a38a059dca" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_120e1c6edcec4f8221f467c8039" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_af129543ec010c822cb6f0254b5" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_af129543ec010c822cb6f0254b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT "FK_120e1c6edcec4f8221f467c8039"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" DROP CONSTRAINT "FK_736f783d6ac6eb1f6a38a059dca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" DROP CONSTRAINT "FK_38e5a5f9d352b462cd38da82df8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" DROP CONSTRAINT "FK_69aa90c76978f30fe3d95dc22a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" DROP CONSTRAINT "FK_925fcb3ddd23b89763f6247a3ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_06502a00f4ff25d2f52f236ac5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "FK_b35463776b4a11a3df3c30d920a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "FK_7829063e3cf13c3d684416bd258"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" DROP CONSTRAINT "FK_9aced16411bd7d56126c91f30cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" DROP CONSTRAINT "FK_3d02ab296296bdb240e89b8786d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" DROP CONSTRAINT "FK_a51bd21a6e90dbe656ad65cab89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP CONSTRAINT "FK_9a0c630e82ada8d515f34285902"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP CONSTRAINT "FK_ceca46c718304e67e2f53aa9f8a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_d3e7278501fe8c5e8cf2cf74be7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_c5c9cd873ffdefe494d331755a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" DROP CONSTRAINT "UQ_1047544e8ada23a7a77d31e6259"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" DROP CONSTRAINT "UQ_0a8665cf674e0acb70c8034b080"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff05fd5159e6d9d99514d46531"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e8f9696f072ec01056c50475ee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ff6fb0cd4c46fe9df52cd1d16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1cdc45c1417ee1c3b47139d7d5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_674b8ae9b331e1d8ff061330af"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_046f3219d9796d57ae2af97cbe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eead2cd6e5be2c86303b786bff"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9316abc534487368cfd8527e8d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9aced16411bd7d56126c91f30c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d02ab296296bdb240e89b8786"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9d1178c9a42b795ced26189cb4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a0c630e82ada8d515f3428590"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ceca46c718304e67e2f53aa9f8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_574dd394846fb85d495d0f77df"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_00634394dce7677d531749ed8e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d011c391e37d9a5e63e8b04c97"`,
    );
    await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD "status" character varying NOT NULL DEFAULT 'Present'`,
    );
    await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "date"`);
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD "date" date NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_method_enum_old" AS ENUM('cash', 'bank_transfer', 'credit_card', 'debit_card', 'check', 'online')`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ALTER COLUMN "paymentMethod" TYPE "public"."payment_method_enum_old" USING "paymentMethod"::"text"::"public"."payment_method_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."fee_paymentmethod_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payment_method_enum_old" RENAME TO "payment_method_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_status_enum_old" AS ENUM('paid', 'unpaid', 'partial', 'overdue')`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ALTER COLUMN "status" TYPE "public"."payment_status_enum_old" USING "status"::"text"::"public"."payment_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."fee_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payment_status_enum_old" RENAME TO "payment_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."assignment_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD "type" character varying NOT NULL DEFAULT 'assignment'`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ALTER COLUMN "dueDate" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN "description"`,
    );
    await queryRunner.query(`ALTER TABLE "assignment" ADD "description" text`);
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "UQ_b35463776b4a11a3df3c30d920a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT "UQ_7829063e3cf13c3d684416bd258"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" DROP CONSTRAINT "UQ_a51bd21a6e90dbe656ad65cab89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" ALTER COLUMN "passcode" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" ALTER COLUMN "fullName" SET DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "class" DROP COLUMN "courseOutline"`);
    await queryRunner.query(`ALTER TABLE "class" ADD "courseOutline" text`);
    await queryRunner.query(
      `ALTER TABLE "class" ALTER COLUMN "weekdays" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" ALTER COLUMN "subjectsAllowed" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" ADD "phone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" ADD CONSTRAINT "UQ_parent_student" UNIQUE ("parentId", "studentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD CONSTRAINT "UQ_student_class_enrollment" UNIQUE ("classId", "studentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_notes" ON "attendance" ("notes") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_student_date" ON "attendance" ("date", "studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_date" ON "attendance" ("date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fee_paymentMethod" ON "fee" ("paymentMethod") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fee_transactionId" ON "fee" ("transactionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fee_status" ON "fee" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fee_dueDate" ON "fee" ("dueDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fee_class" ON "fee" ("classId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fee_student" ON "fee" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_performance_assignment" ON "performance" ("assignmentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_performance_student" ON "performance" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_maxScore" ON "assignment" ("maxScore") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_student_name" ON "student" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_student_student_id" ON "student" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parent_student_status" ON "parent_student" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parent_student_student_id" ON "parent_student" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parent_student_parent_id" ON "parent_student" ("parentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parent_phone" ON "parent" ("phone") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_parent_email" ON "parent" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_enrollment_status" ON "student_class_enrollment" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_enrollment_class_id" ON "student_class_enrollment" ("classId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_enrollment_student_id" ON "student_class_enrollment" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_name" ON "class" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_teacher_email" ON "teacher" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subject_name" ON "subject" ("name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ADD CONSTRAINT "FK_fee_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fee" ADD CONSTRAINT "FK_fee_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" ADD CONSTRAINT "FK_performance_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" ADD CONSTRAINT "FK_performance_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_assignment_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_student_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_student_photo" FOREIGN KEY ("photoId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" ADD CONSTRAINT "FK_parent_student_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent_student" ADD CONSTRAINT "FK_parent_student_parent" FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parent" ADD CONSTRAINT "FK_parent_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD CONSTRAINT "FK_enrollment_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_class_enrollment" ADD CONSTRAINT "FK_enrollment_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_class_teacher" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_class_subject" FOREIGN KEY ("subjectId") REFERENCES "subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
