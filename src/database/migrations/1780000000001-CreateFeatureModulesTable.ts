import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeatureModulesTable1780000000001
  implements MigrationInterface
{
  name = 'CreateFeatureModulesTable1780000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create feature_modules table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feature_modules" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL UNIQUE,
        "display_name" character varying(255) NOT NULL,
        "description" text,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "icon" character varying(100),
        "category" character varying(50) NOT NULL,
        "module_type" character varying(20) NOT NULL DEFAULT 'feature',
        "sort_order" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feature_modules" PRIMARY KEY ("id")
      )
    `);

    // Create index on module_type for faster queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feature_modules_module_type" 
      ON "feature_modules" ("module_type")
    `);

    // Create index on name for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feature_modules_name" 
      ON "feature_modules" ("name")
    `);

    // Seed app features (all enabled by default)
    await queryRunner.query(`
      INSERT INTO "feature_modules" 
        (name, display_name, description, is_enabled, icon, category, module_type, sort_order)
      VALUES
        ('students', 'Student Management', 'Manage students, enrollments, and student data', true, 'solar:users-group-rounded-bold-duotone', 'management', 'feature', 1),
        ('teachers', 'Teacher Management', 'Manage teachers and their assignments', true, 'solar:user-bold-duotone', 'management', 'feature', 2),
        ('classes', 'Classes & Courses', 'Manage classes, courses, and class schedules', true, 'solar:book-bold-duotone', 'academic', 'feature', 3),
        ('subjects', 'Subjects', 'Manage subjects and curriculum', true, 'solar:notebook-bold-duotone', 'academic', 'feature', 4),
        ('parents', 'Parent Portal', 'Manage parent accounts and parent-student relationships', true, 'solar:users-group-rounded-bold-duotone', 'management', 'feature', 5),
        ('assignments', 'Assignments', 'Create and manage assignments and submissions', true, 'solar:document-bold-duotone', 'academic', 'feature', 6),
        ('attendance', 'Attendance', 'Track and manage student attendance', true, 'solar:calendar-bold-duotone', 'academic', 'feature', 7),
        ('fees', 'Fee Management', 'Manage fees, invoices, and payments', true, 'solar:wallet-bold-duotone', 'financial', 'feature', 8),
        ('library', 'File Library', 'Manage and organize file library', true, 'solar:folder-bold-duotone', 'management', 'feature', 9),
        ('announcements', 'Announcements', 'Create and manage announcements', true, 'solar:megaphone-bold-duotone', 'management', 'feature', 10),
        ('sms', 'SMS & WhatsApp', 'Send SMS and WhatsApp notifications', true, 'solar:chat-round-bold-duotone', 'communication', 'feature', 11),
        ('reports', 'Reports & Analytics', 'View reports and analytics', true, 'solar:chart-bold-duotone', 'management', 'feature', 12)
      ON CONFLICT (name) DO NOTHING;
    `);

    // Seed settings tabs (some disabled for regular admin by default)
    await queryRunner.query(`
      INSERT INTO "feature_modules" 
        (name, display_name, description, is_enabled, icon, category, module_type, sort_order)
      VALUES
        ('business_info', 'Business Information', 'Configure business address, company details, and contact information', true, 'solar:building-bold-duotone', 'settings', 'settings_tab', 1),
        ('bank_details', 'Bank Details', 'Configure bank account information', true, 'solar:bank-bold-duotone', 'settings', 'settings_tab', 2),
        ('social_media', 'Social Media', 'Configure social media links', true, 'solar:share-bold-duotone', 'settings', 'settings_tab', 3),
        ('theme', 'Theme Settings', 'Configure theme colors and appearance', true, 'solar:palette-bold-duotone', 'settings', 'settings_tab', 4),
        ('payment_gateways', 'Payment Gateways', 'Configure payment gateway credentials and settings', false, 'solar:card-bold-duotone', 'settings', 'settings_tab', 5),
        ('smtp_config', 'SMTP Configuration', 'Configure email server settings', false, 'solar:letter-bold-duotone', 'settings', 'settings_tab', 6),
        ('file_storage', 'File Storage', 'Configure file storage providers (S3, Azure, etc.)', false, 'solar:folder-bold-duotone', 'settings', 'settings_tab', 7),
        ('sms_config', 'SMS & WhatsApp Config', 'Configure SMS and WhatsApp provider settings', false, 'solar:chat-round-bold-duotone', 'settings', 'settings_tab', 8),
        ('app_config', 'App Configuration', 'Configure app name, logos, and branding', false, 'solar:settings-bold-duotone', 'settings', 'settings_tab', 9)
      ON CONFLICT (name) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feature_modules_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feature_modules_module_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "feature_modules"`);
  }
}
