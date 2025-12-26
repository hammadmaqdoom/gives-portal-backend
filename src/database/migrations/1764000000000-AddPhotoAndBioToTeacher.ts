import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotoAndBioToTeacher1764000000000
  implements MigrationInterface
{
  name = 'AddPhotoAndBioToTeacher1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "teacher" ADD "photoId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" ADD "bio" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" ADD "showOnPublicSite" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" ADD "displayOrder" integer DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" ADD CONSTRAINT "FK_teacher_photo" FOREIGN KEY ("photoId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "teacher" DROP CONSTRAINT "FK_teacher_photo"`,
    );
    await queryRunner.query(`ALTER TABLE "teacher" DROP COLUMN "displayOrder"`);
    await queryRunner.query(
      `ALTER TABLE "teacher" DROP COLUMN "showOnPublicSite"`,
    );
    await queryRunner.query(`ALTER TABLE "teacher" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "teacher" DROP COLUMN "photoId"`);
  }
}

