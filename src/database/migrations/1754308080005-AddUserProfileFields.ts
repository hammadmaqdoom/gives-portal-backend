import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1754308080005 implements MigrationInterface {
  name = 'AddUserProfileFields1754308080005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "phone" varchar`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "bio" text`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "address" varchar`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "city" varchar`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "country" varchar`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "dateOfBirth" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "dateOfBirth"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone"`);
  }
}
