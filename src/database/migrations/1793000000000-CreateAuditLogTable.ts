import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogTable1793000000000 implements MigrationInterface {
  name = 'CreateAuditLogTable1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "audit_log_event_type_enum" AS ENUM (
        'LOGIN_SUCCESS',
        'LOGIN_FAILURE',
        'LOGOUT',
        'DATA_CREATE',
        'DATA_UPDATE',
        'DATA_DELETE',
        'ROLE_CHANGE',
        'SETTINGS_CHANGE',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id" SERIAL NOT NULL,
        "eventType" "audit_log_event_type_enum" NOT NULL,
        "userId" integer,
        "userEmail" character varying(255),
        "userRole" character varying(50),
        "resource" character varying(255),
        "resourceId" character varying(255),
        "details" jsonb,
        "ipAddress" character varying(45),
        "userAgent" character varying(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_eventType" ON "audit_log" ("eventType")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_userId" ON "audit_log" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_log_createdAt" ON "audit_log" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "audit_log_event_type_enum"`);
  }
}
