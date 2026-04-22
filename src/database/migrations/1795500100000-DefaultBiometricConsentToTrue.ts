import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Product decision: default biometric consent to TRUE ("enrolled / accepted")
 * for every student, shifting the policy from opt-in to opt-out.
 *
 * This assumes consent is collected offline (enrollment forms, parent
 * waivers, etc.) and the LMS is the system of record for it. Admins can
 * still explicitly revoke via the existing consent UI, which writes an
 * audit row and wipes enrolled face samples.
 *
 * Migration work:
 *   1. Change the column default from false → true so newly-created
 *      students inherit the new policy.
 *   2. Backfill existing students that have never been touched
 *      (biometricConsentAt IS NULL) so they match the new default.
 *      Rows where consent was explicitly recorded (granted or revoked)
 *      keep their current value to preserve the audit trail.
 */
export class DefaultBiometricConsentToTrue1795500100000
  implements MigrationInterface
{
  name = 'DefaultBiometricConsentToTrue1795500100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student"
      ALTER COLUMN "biometricConsent" SET DEFAULT true
    `);

    await queryRunner.query(`
      UPDATE "student"
      SET "biometricConsent" = true
      WHERE "biometricConsent" = false
        AND "biometricConsentAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student"
      ALTER COLUMN "biometricConsent" SET DEFAULT false
    `);
    // We deliberately do NOT reverse the backfill — flipping consent off
    // for students would silently wipe a legal record of their acceptance.
  }
}
