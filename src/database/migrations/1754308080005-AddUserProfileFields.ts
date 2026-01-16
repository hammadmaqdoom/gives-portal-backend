import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1754308080005 implements MigrationInterface {
  name = 'AddUserProfileFields1754308080005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user' AND column_name = 'phone'
        ) THEN
          ALTER TABLE "user" ADD COLUMN "phone" varchar;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user' AND column_name = 'bio'
        ) THEN
          ALTER TABLE "user" ADD COLUMN "bio" text;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user' AND column_name = 'address'
        ) THEN
          ALTER TABLE "user" ADD COLUMN "address" varchar;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user' AND column_name = 'city'
        ) THEN
          ALTER TABLE "user" ADD COLUMN "city" varchar;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user' AND column_name = 'country'
        ) THEN
          ALTER TABLE "user" ADD COLUMN "country" varchar;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user' AND column_name = 'dateOfBirth'
        ) THEN
          ALTER TABLE "user" ADD COLUMN "dateOfBirth" date;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "dateOfBirth"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "country"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "city"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "address"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "bio"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "phone"`);
  }
}
