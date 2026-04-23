import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds biometric-consent tracking to the student table and new
 * audit-event types for facial-recognition activity. We reuse the
 * existing audit_log table (see 1793000000000-CreateAuditLogTable.ts)
 * rather than introducing a parallel log so admins have a single
 * pane of glass for compliance review.
 */
export class AddBiometricConsentAndAuditEvents1795500000000
  implements MigrationInterface
{
  name = 'AddBiometricConsentAndAuditEvents1795500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Consent tracking on student.
    //    - biometricConsent: hard gate for enrollment (default false).
    //    - biometricConsentAt: when it was granted (or last revoked).
    //    - biometricConsentBy: which user (admin / guardian account)
    //      recorded the consent, for accountability.
    await queryRunner.query(`
      ALTER TABLE "student"
      ADD COLUMN IF NOT EXISTS "biometricConsent" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "student"
      ADD COLUMN IF NOT EXISTS "biometricConsentAt" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "student"
      ADD COLUMN IF NOT EXISTS "biometricConsentBy" integer
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_student_biometric_consent_by') THEN
          ALTER TABLE "student"
          ADD CONSTRAINT "FK_student_biometric_consent_by"
          FOREIGN KEY ("biometricConsentBy") REFERENCES "user"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    // 2) Extend the shared audit_log enum with biometric-specific events.
    //    ADD VALUE IF NOT EXISTS is idempotent on re-run.
    const newValues = [
      'BIOMETRIC_CONSENT_GRANTED',
      'BIOMETRIC_CONSENT_REVOKED',
      'FACE_ENROLL',
      'FACE_UNENROLL',
      'FACE_UNENROLL_ALL',
      'FACE_MATCH',
      'FACE_MANUAL_OVERRIDE',
    ];
    for (const v of newValues) {
      // eslint-disable-next-line no-await-in-loop
      await queryRunner.query(
        `ALTER TYPE "audit_log_event_type_enum" ADD VALUE IF NOT EXISTS '${v}'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Enum values cannot be dropped in Postgres without recreating the type.
    // We only roll back the student columns; existing audit rows with new
    // event types would orphan them, and this is rarely needed in practice.
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_student_biometric_consent_by') THEN
          ALTER TABLE "student" DROP CONSTRAINT "FK_student_biometric_consent_by";
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN IF EXISTS "biometricConsentBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN IF EXISTS "biometricConsentAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN IF EXISTS "biometricConsent"`,
    );
  }
}
