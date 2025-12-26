import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubjectCurriculumFields1765000000000
  implements MigrationInterface
{
  name = 'AddSubjectCurriculumFields1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subject" ADD "syllabusCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "subject" ADD "level" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "subject" ADD "officialLink" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subject" DROP COLUMN "officialLink"`);
    await queryRunner.query(`ALTER TABLE "subject" DROP COLUMN "level"`);
    await queryRunner.query(`ALTER TABLE "subject" DROP COLUMN "syllabusCode"`);
  }
}

