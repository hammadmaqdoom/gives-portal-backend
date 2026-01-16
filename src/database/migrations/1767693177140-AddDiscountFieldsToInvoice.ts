import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountFieldsToInvoice1767693177140
  implements MigrationInterface
{
  name = 'AddDiscountFieldsToInvoice1767693177140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "FK_75e2be4ce11d447ef43be0e374f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" DROP CONSTRAINT IF EXISTS "FK_teacher_photo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" DROP CONSTRAINT IF EXISTS "FK_f572b5a1782577dfc12c7a99ba0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT IF EXISTS "FK_7829063e3cf13c3d684416bd258"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_schedule" DROP CONSTRAINT IF EXISTS "FK_class_schedule_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_schedule" DROP CONSTRAINT IF EXISTS "FK_05aeba08a8d17392036d9292db1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "FK_class_cover_image_file"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "FK_e8c5cf11cac792aeab5d0db5696"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "FK_class_thumbnail_file"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "FK_7bda5d51a1b3da5c8246fcbcbb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" DROP CONSTRAINT IF EXISTS "FK_zoom_meetings_teacher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" DROP CONSTRAINT IF EXISTS "FK_12e44d31d176b2300c018e9860d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" DROP CONSTRAINT IF EXISTS "FK_zoom_meetings_class_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" DROP CONSTRAINT IF EXISTS "FK_1069de1d429a70aca1801c2add7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_credentials" DROP CONSTRAINT IF EXISTS "FK_zoom_credentials_teacher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_credentials" DROP CONSTRAINT IF EXISTS "FK_444404b6aee45cacead41a12315"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submission" DROP CONSTRAINT IF EXISTS "FK_submission_assignment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submission" DROP CONSTRAINT IF EXISTS "FK_submission_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT IF EXISTS "FK_assignment_teacher"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" DROP CONSTRAINT IF EXISTS "FK_teacher_commission_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" DROP CONSTRAINT IF EXISTS "FK_teacher_commission_class"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" DROP CONSTRAINT IF EXISTS "FK_teacher_commission_teacher"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway_credentials" DROP CONSTRAINT IF EXISTS "FK_payment_gateway_credentials_gateway"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "FK_invoice_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "FK_invoice_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" DROP CONSTRAINT IF EXISTS "FK_payment_transaction_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" DROP CONSTRAINT IF EXISTS "FK_payment_transaction_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" DROP CONSTRAINT IF EXISTS "FK_payment_transaction_invoice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" DROP CONSTRAINT IF EXISTS "FK_payment_transaction_gateway"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module_section" DROP CONSTRAINT IF EXISTS "FK_46a5a955f1d35f07161a6494c0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP CONSTRAINT IF EXISTS "FK_951de844e26a1023106ddc1b069"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP CONSTRAINT IF EXISTS "FK_learning_module_zoom_meeting"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP CONSTRAINT IF EXISTS "FK_34899815c25c1c52690e6dfd6f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_item" DROP CONSTRAINT IF EXISTS "FK_cart_item_cart"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP CONSTRAINT IF EXISTS "FK_d351c526fb2245e761711d9f2b4"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_FILES_CONTEXT"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_FILES_UPLOADED_AT"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_FILES_UPLOADED_BY"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_class_schedule_class_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_class_schedule_weekday"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_class_schedule_active"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_class_is_public_for_sale"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_class_thumbnail_file_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_class_cover_image_file_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_zoom_meetings_class_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_zoom_meetings_teacher_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_zoom_meetings_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_zoom_meetings_start_time"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_zoom_credentials_teacher_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_assignment_teacher"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_teacher_commission_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_teacher_commission_teacher"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_teacher_commission_class"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_teacher_commission_student"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_teacher_commission_due_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payment_gateway_credentials_gateway"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payment_gateway_credentials_environment"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_invoice_invoiceNumber"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_invoice_studentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_invoice_parentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_invoice_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_invoice_dueDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_payment_transaction_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payment_transaction_gateway_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payment_transaction_gateway"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payment_transaction_invoice"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payment_transaction_student"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payment_transaction_status"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_payment_gateway_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_payment_gateway_active"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_payment_gateway_default"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_learning_module_is_previewable"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_learning_module_is_pinned"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_learning_module_zoom_meeting"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_cart_item_cartId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_cart_item_classId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_cart_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_cart_sessionId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_batch_term_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_batch_term_is_active"`);
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "class_classMode_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rate" DROP CONSTRAINT IF EXISTS "UQ_currency_rate_date_base"`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_completion" DROP CONSTRAINT IF EXISTS "uq_student_module"`,
    );
    // Drop AI-related columns from settings table if they exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='aiEnabled') THEN
          ALTER TABLE "settings" DROP COLUMN "aiEnabled";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='aiProvider') THEN
          ALTER TABLE "settings" DROP COLUMN "aiProvider";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='openaiApiKey') THEN
          ALTER TABLE "settings" DROP COLUMN "openaiApiKey";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='claudeApiKey') THEN
          ALTER TABLE "settings" DROP COLUMN "claudeApiKey";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='aiModel') THEN
          ALTER TABLE "settings" DROP COLUMN "aiModel";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='aiBaseUrl') THEN
          ALTER TABLE "settings" DROP COLUMN "aiBaseUrl";
        END IF;
      END $$;
    `);
    // Add class_id to performance table if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='performance' AND column_name='class_id') THEN
          ALTER TABLE "performance" ADD "class_id" integer;
        END IF;
      END $$;
    `);
    // Add originalPrice to invoice table if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice' AND column_name='originalPrice') THEN
          ALTER TABLE "invoice" ADD "originalPrice" numeric(10,2);
        END IF;
      END $$;
    `);
    // Add discountAmount to invoice table if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice' AND column_name='discountAmount') THEN
          ALTER TABLE "invoice" ADD "discountAmount" numeric(10,2) DEFAULT '0';
        END IF;
      END $$;
    `);
    // Add discountType to invoice table if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice' AND column_name='discountType') THEN
          ALTER TABLE "invoice" ADD "discountType" character varying(100);
        END IF;
      END $$;
    `);
    // Add classId to invoice table if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice' AND column_name='classId') THEN
          ALTER TABLE "invoice" ADD "classId" integer;
        END IF;
      END $$;
    `);
    // Modify files table columns with conditional checks
    // Handle files.filename - skip if already exists with correct type
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='files' 
          AND column_name='filename' 
          AND is_nullable='NO'
          AND data_type='character varying'
        ) THEN
          -- Column doesn't exist or is nullable, handle it
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='files' AND column_name='filename') THEN
            -- Column exists but is nullable, update nulls and make NOT NULL
            UPDATE "files" SET "filename" = COALESCE("filename", 'unknown') WHERE "filename" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "filename" SET NOT NULL;
          ELSE
            -- Column doesn't exist, add it as nullable first
            ALTER TABLE "files" ADD "filename" character varying;
            UPDATE "files" SET "filename" = 'unknown' WHERE "filename" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "filename" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    // Handle files.originalName
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='files' 
          AND column_name='originalName' 
          AND is_nullable='NO'
          AND data_type='character varying'
        ) THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='files' AND column_name='originalName') THEN
            UPDATE "files" SET "originalName" = COALESCE("originalName", 'unknown') WHERE "originalName" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "originalName" SET NOT NULL;
          ELSE
            ALTER TABLE "files" ADD "originalName" character varying;
            UPDATE "files" SET "originalName" = 'unknown' WHERE "originalName" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "originalName" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    // Handle files.path
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='files' 
          AND column_name='path' 
          AND is_nullable='NO'
          AND data_type='character varying'
        ) THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='files' AND column_name='path') THEN
            UPDATE "files" SET "path" = COALESCE("path", '') WHERE "path" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "path" SET NOT NULL;
          ELSE
            ALTER TABLE "files" ADD "path" character varying;
            UPDATE "files" SET "path" = '' WHERE "path" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "path" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    // Handle files.url (nullable)
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='files' 
          AND column_name='url' 
          AND data_type='character varying'
        ) THEN
          ALTER TABLE "files" ADD "url" character varying;
        END IF;
      END $$;
    `);
    // Handle files.mimeType
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='files' 
          AND column_name='mimeType' 
          AND is_nullable='NO'
          AND data_type='character varying'
        ) THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='files' AND column_name='mimeType') THEN
            UPDATE "files" SET "mimeType" = COALESCE("mimeType", 'application/octet-stream') WHERE "mimeType" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "mimeType" SET NOT NULL;
          ELSE
            ALTER TABLE "files" ADD "mimeType" character varying;
            UPDATE "files" SET "mimeType" = 'application/octet-stream' WHERE "mimeType" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "mimeType" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    // Handle files.uploadedBy
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='files' 
          AND column_name='uploadedBy' 
          AND is_nullable='NO'
          AND data_type='character varying'
        ) THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='files' AND column_name='uploadedBy') THEN
            UPDATE "files" SET "uploadedBy" = COALESCE("uploadedBy", 'system') WHERE "uploadedBy" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "uploadedBy" SET NOT NULL;
          ELSE
            ALTER TABLE "files" ADD "uploadedBy" character varying;
            UPDATE "files" SET "uploadedBy" = 'system' WHERE "uploadedBy" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "uploadedBy" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "uploadedAt" SET DEFAULT now()`,
    );
    // Handle files.contextType
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='files' 
          AND column_name='contextType' 
          AND is_nullable='NO'
          AND data_type='character varying'
        ) THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='files' AND column_name='contextType') THEN
            UPDATE "files" SET "contextType" = COALESCE("contextType", 'generic') WHERE "contextType" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "contextType" SET NOT NULL;
          ELSE
            ALTER TABLE "files" ADD "contextType" character varying;
            UPDATE "files" SET "contextType" = 'generic' WHERE "contextType" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "contextType" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    // Handle files.contextId
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='files' 
          AND column_name='contextId' 
          AND is_nullable='NO'
          AND data_type='character varying'
        ) THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='files' AND column_name='contextId') THEN
            UPDATE "files" SET "contextId" = COALESCE("contextId", '0') WHERE "contextId" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "contextId" SET NOT NULL;
          ELSE
            ALTER TABLE "files" ADD "contextId" character varying;
            UPDATE "files" SET "contextId" = '0' WHERE "contextId" IS NULL;
            ALTER TABLE "files" ALTER COLUMN "contextId" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='teacher' 
          AND column_name='displayOrder' 
          AND is_nullable='YES'
        ) THEN
          UPDATE "teacher" SET "displayOrder" = COALESCE("displayOrder", 0) WHERE "displayOrder" IS NULL;
          ALTER TABLE "teacher" ALTER COLUMN "displayOrder" SET NOT NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'UQ_f572b5a1782577dfc12c7a99ba0'
        ) THEN
          ALTER TABLE "teacher" ADD CONSTRAINT "UQ_f572b5a1782577dfc12c7a99ba0" UNIQUE ("photoId");
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'weekday_enum') THEN
          ALTER TYPE "public"."weekday_enum" RENAME TO "weekday_enum_old";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_schedule_weekday_enum') THEN
          CREATE TYPE "public"."class_schedule_weekday_enum" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class_schedule' AND column_name='weekday') THEN
          ALTER TABLE "class_schedule" ALTER COLUMN "weekday" TYPE "public"."class_schedule_weekday_enum" USING "weekday"::"text"::"public"."class_schedule_weekday_enum";
        END IF;
      END $$;
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."weekday_enum_old"`);
    // Handle class_schedule.startTime - check if it exists with correct type and constraints
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='class_schedule' 
          AND column_name='startTime' 
          AND is_nullable='NO'
          AND udt_name='time'
        ) THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class_schedule' AND column_name='startTime') THEN
            -- Column exists but is nullable or wrong type, update nulls and make NOT NULL
            UPDATE "class_schedule" SET "startTime" = COALESCE("startTime"::TIME, '09:00:00'::TIME) WHERE "startTime" IS NULL;
            ALTER TABLE "class_schedule" ALTER COLUMN "startTime" TYPE TIME;
            ALTER TABLE "class_schedule" ALTER COLUMN "startTime" SET NOT NULL;
          ELSE
            -- Column doesn't exist, add it as nullable first
            ALTER TABLE "class_schedule" ADD "startTime" TIME;
            UPDATE "class_schedule" SET "startTime" = '09:00:00'::TIME WHERE "startTime" IS NULL;
            ALTER TABLE "class_schedule" ALTER COLUMN "startTime" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    // Handle class_schedule.endTime - check if it exists with correct type and constraints
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='class_schedule' 
          AND column_name='endTime' 
          AND is_nullable='NO'
          AND udt_name='time'
        ) THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class_schedule' AND column_name='endTime') THEN
            -- Column exists but is nullable or wrong type, update nulls and make NOT NULL
            UPDATE "class_schedule" SET "endTime" = COALESCE("endTime"::TIME, '10:00:00'::TIME) WHERE "endTime" IS NULL;
            ALTER TABLE "class_schedule" ALTER COLUMN "endTime" TYPE TIME;
            ALTER TABLE "class_schedule" ALTER COLUMN "endTime" SET NOT NULL;
          ELSE
            -- Column doesn't exist, add it as nullable first
            ALTER TABLE "class_schedule" ADD "endTime" TIME;
            UPDATE "class_schedule" SET "endTime" = '10:00:00'::TIME WHERE "endTime" IS NULL;
            ALTER TABLE "class_schedule" ALTER COLUMN "endTime" SET NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='class' 
          AND column_name='feeUSD' 
          AND is_nullable='YES'
        ) THEN
          UPDATE "class" SET "feeUSD" = COALESCE("feeUSD", 0) WHERE "feeUSD" IS NULL;
          ALTER TABLE "class" ALTER COLUMN "feeUSD" SET NOT NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='class' 
          AND column_name='feePKR' 
          AND is_nullable='YES'
        ) THEN
          UPDATE "class" SET "feePKR" = COALESCE("feePKR", 0) WHERE "feePKR" IS NULL;
          ALTER TABLE "class" ALTER COLUMN "feePKR" SET NOT NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class' AND column_name='classMode') THEN
          ALTER TABLE "class" DROP COLUMN "classMode";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_classmode_enum') THEN
          CREATE TYPE "public"."class_classmode_enum" AS ENUM('virtual', 'in-person', 'hybrid');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class' AND column_name='classMode') THEN
          ALTER TABLE "class" ADD "classMode" "public"."class_classmode_enum" NOT NULL DEFAULT 'virtual';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'UQ_7bda5d51a1b3da5c8246fcbcbb8'
        ) THEN
          ALTER TABLE "class" ADD CONSTRAINT "UQ_7bda5d51a1b3da5c8246fcbcbb8" UNIQUE ("thumbnail_file_id");
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'UQ_e8c5cf11cac792aeab5d0db5696'
        ) THEN
          ALTER TABLE "class" ADD CONSTRAINT "UQ_e8c5cf11cac792aeab5d0db5696" UNIQUE ("cover_image_file_id");
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_type_enum') THEN
          ALTER TYPE "public"."assignment_type_enum" RENAME TO "assignment_type_enum_old";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_type_enum') THEN
          CREATE TYPE "public"."assignment_type_enum" AS ENUM('assignment', 'exam', 'quiz', 'project', 'activity', 'practice');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignment' AND column_name='type') THEN
          ALTER TABLE "assignment" ALTER COLUMN "type" TYPE "public"."assignment_type_enum" USING "type"::"text"::"public"."assignment_type_enum";
        END IF;
      END $$;
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."assignment_type_enum_old"`);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='assignment' 
          AND column_name='status' 
          AND is_nullable='YES'
        ) THEN
          UPDATE "assignment" SET "status" = COALESCE("status", 'draft') WHERE "status" IS NULL;
          ALTER TABLE "assignment" ALTER COLUMN "status" SET NOT NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "payment_gateway_credentials" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway_credentials" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice' AND column_name='status') THEN
          ALTER TABLE "invoice" DROP COLUMN "status";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status_enum') THEN
          CREATE TYPE "public"."invoice_status_enum" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice' AND column_name='status') THEN
          ALTER TABLE "invoice" ADD "status" "public"."invoice_status_enum" NOT NULL DEFAULT 'draft';
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "invoice" ALTER COLUMN "generatedDate" SET DEFAULT now()`,
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice' AND column_name='paymentMethod') THEN
          ALTER TABLE "invoice" DROP COLUMN "paymentMethod";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_paymentmethod_enum') THEN
          CREATE TYPE "public"."invoice_paymentmethod_enum" AS ENUM('cash', 'bank_transfer', 'check', 'online', 'credit_card');
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice' AND column_name='paymentMethod') THEN
          ALTER TABLE "invoice" ADD "paymentMethod" "public"."invoice_paymentmethod_enum";
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "invoice" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ALTER COLUMN "studentId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='payment_gateway' 
          AND column_name='processingFee' 
          AND is_nullable='YES'
        ) THEN
          UPDATE "payment_gateway" SET "processingFee" = COALESCE("processingFee", 0) WHERE "processingFee" IS NULL;
          ALTER TABLE "payment_gateway" ALTER COLUMN "processingFee" SET NOT NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "payment_gateway" ALTER COLUMN "processingFee" SET DEFAULT '0'`,
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='payment_gateway' 
          AND column_name='processingFeeType' 
          AND is_nullable='YES'
        ) THEN
          UPDATE "payment_gateway" SET "processingFeeType" = COALESCE("processingFeeType", 'percentage') WHERE "processingFeeType" IS NULL;
          ALTER TABLE "payment_gateway" ALTER COLUMN "processingFeeType" SET NOT NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='payment_gateway' 
          AND column_name='sortOrder' 
          AND is_nullable='YES'
        ) THEN
          UPDATE "payment_gateway" SET "sortOrder" = COALESCE("sortOrder", 0) WHERE "sortOrder" IS NULL;
          ALTER TABLE "payment_gateway" ALTER COLUMN "sortOrder" SET NOT NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "payment_gateway" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_module' AND column_name='contentHtml') THEN
          ALTER TABLE "learning_module" DROP COLUMN "contentHtml";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_module' AND column_name='contentHtml') THEN
          ALTER TABLE "learning_module" ADD "contentHtml" character varying;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_module' AND column_name='groupId') THEN
          ALTER TABLE "learning_module" DROP COLUMN "groupId";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_module' AND column_name='groupId') THEN
          ALTER TABLE "learning_module" ADD "groupId" bigint;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_module' AND column_name='zoom_meeting_url') THEN
          ALTER TABLE "learning_module" DROP COLUMN "zoom_meeting_url";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_module' AND column_name='zoom_meeting_url') THEN
          ALTER TABLE "learning_module" ADD "zoom_meeting_url" character varying;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_module' AND column_name='zoom_meeting_password') THEN
          ALTER TABLE "learning_module" DROP COLUMN "zoom_meeting_password";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_module' AND column_name='zoom_meeting_password') THEN
          ALTER TABLE "learning_module" ADD "zoom_meeting_password" character varying;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "module_completion" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_completion" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcement' AND column_name='bodyHtml') THEN
          ALTER TABLE "announcement" DROP COLUMN "bodyHtml";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcement' AND column_name='bodyHtml') THEN
          ALTER TABLE "announcement" ADD "bodyHtml" character varying;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='batch_term' 
          AND column_name='display_order' 
          AND is_nullable='YES'
        ) THEN
          UPDATE "batch_term" SET "display_order" = COALESCE("display_order", 0) WHERE "display_order" IS NULL;
          ALTER TABLE "batch_term" ALTER COLUMN "display_order" SET NOT NULL;
        END IF;
      END $$;
    `);
    // Create indexes with existence checks
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_36d4f648e4fa4248f338c1260a" ON "currency_rate" ("date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_05aeba08a8d17392036d9292db" ON "class_schedule" ("classId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_04a58564ad172e19f4ba1ca5d3" ON "submission" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_c4020657e7c74f2820a38daa76" ON "teacher_commission" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_d7bed97fb47876e03fd7d7c285" ON "invoice" ("invoiceNumber")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_a7564a78ed154d2f0735f92638" ON "invoice" ("discountType")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cd564ee5eca8208abfc3e844b1" ON "invoice" ("classId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_66da32c33acd364a777ac44f51" ON "payment_transaction" ("transactionId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_d7f13295d0478884f4da37f53e" ON "payment_transaction" ("gatewayTransactionId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_d1644874e2d361c4d2e3053ef0" ON "payment_transaction" ("gatewayId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_8fbffcf42dd2aed246ba60cee6" ON "payment_transaction" ("invoiceId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_68491493ba4ef63c564ee84242" ON "payment_transaction" ("studentId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_6016e900fd479cc96fb38a0073" ON "payment_transaction" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_a2ed43097e015a86f92c633273" ON "learning_module_section" ("title")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_187aaac7bf1e8e7a06cbb0c9ca" ON "learning_module" ("title")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_9185a45947c2fed7c73fda2d30" ON "module_completion" ("module_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_b1614eb3e81fefa6f595fb8b5d" ON "module_completion" ("student_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_29e590514f9941296f3a2440d3" ON "cart_item" ("cartId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_aae147f9a912e8a2dcd69d14eb" ON "cart_item" ("classId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_756f53ab9466eb52a52619ee01" ON "cart" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_4c5b32b563e11a3a7700b50e4a" ON "cart" ("sessionId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_e02da6a28440ff009cd1f62511" ON "announcement" ("title")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_6f59e5ff429f28f48e37d26204" ON "batch_term" ("name") WHERE "deleted_at" IS NULL`);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'UQ_8b175b27d8dd0e05d7a793a9b43'
        ) THEN
          ALTER TABLE "currency_rate" ADD CONSTRAINT "UQ_8b175b27d8dd0e05d7a793a9b43" UNIQUE ("base", "date");
        END IF;
      END $$;
    `);
    // Add foreign key constraints with existence checks
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_75e2be4ce11d447ef43be0e374f') THEN
          ALTER TABLE "user" ADD CONSTRAINT "FK_75e2be4ce11d447ef43be0e374f" FOREIGN KEY ("photoId") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_f572b5a1782577dfc12c7a99ba0') THEN
          ALTER TABLE "teacher" ADD CONSTRAINT "FK_f572b5a1782577dfc12c7a99ba0" FOREIGN KEY ("photoId") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_7829063e3cf13c3d684416bd258') THEN
          ALTER TABLE "student" ADD CONSTRAINT "FK_7829063e3cf13c3d684416bd258" FOREIGN KEY ("photoId") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_05aeba08a8d17392036d9292db1') THEN
          ALTER TABLE "class_schedule" ADD CONSTRAINT "FK_05aeba08a8d17392036d9292db1" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_7bda5d51a1b3da5c8246fcbcbb8') THEN
          ALTER TABLE "class" ADD CONSTRAINT "FK_7bda5d51a1b3da5c8246fcbcbb8" FOREIGN KEY ("thumbnail_file_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_e8c5cf11cac792aeab5d0db5696') THEN
          ALTER TABLE "class" ADD CONSTRAINT "FK_e8c5cf11cac792aeab5d0db5696" FOREIGN KEY ("cover_image_file_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_1069de1d429a70aca1801c2add7') THEN
          ALTER TABLE "zoom_meetings" ADD CONSTRAINT "FK_1069de1d429a70aca1801c2add7" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_12e44d31d176b2300c018e9860d') THEN
          ALTER TABLE "zoom_meetings" ADD CONSTRAINT "FK_12e44d31d176b2300c018e9860d" FOREIGN KEY ("teacher_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_444404b6aee45cacead41a12315') THEN
          ALTER TABLE "zoom_credentials" ADD CONSTRAINT "FK_444404b6aee45cacead41a12315" FOREIGN KEY ("teacher_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_a174d175dc504dce8df5c217014') THEN
          ALTER TABLE "submission" ADD CONSTRAINT "FK_a174d175dc504dce8df5c217014" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ef99745f278ca701c5efe5d8ddd') THEN
          ALTER TABLE "submission" ADD CONSTRAINT "FK_ef99745f278ca701c5efe5d8ddd" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_12fec8981c30ecef4932627c260') THEN
          ALTER TABLE "assignment" ADD CONSTRAINT "FK_12fec8981c30ecef4932627c260" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_517e75cc71ebeb789db33934e39') THEN
          ALTER TABLE "performance" ADD CONSTRAINT "FK_517e75cc71ebeb789db33934e39" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_213183636ad30d9527e781a9f20') THEN
          ALTER TABLE "teacher_commission" ADD CONSTRAINT "FK_213183636ad30d9527e781a9f20" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_9d22a4c3df301634fdb24ea1a3b') THEN
          ALTER TABLE "teacher_commission" ADD CONSTRAINT "FK_9d22a4c3df301634fdb24ea1a3b" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_558a7ab17d9528ec4ec0adec6dc') THEN
          ALTER TABLE "teacher_commission" ADD CONSTRAINT "FK_558a7ab17d9528ec4ec0adec6dc" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_8d1db54d80be44ea6aaa2f5a279') THEN
          ALTER TABLE "payment_gateway_credentials" ADD CONSTRAINT "FK_8d1db54d80be44ea6aaa2f5a279" FOREIGN KEY ("gatewayId") REFERENCES "payment_gateway"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_f7c11d71265b46bca3b920e29a0') THEN
          ALTER TABLE "invoice" ADD CONSTRAINT "FK_f7c11d71265b46bca3b920e29a0" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_455b676ff4827528174f4369a6b') THEN
          ALTER TABLE "invoice" ADD CONSTRAINT "FK_455b676ff4827528174f4369a6b" FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_d1644874e2d361c4d2e3053ef07') THEN
          ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_d1644874e2d361c4d2e3053ef07" FOREIGN KEY ("gatewayId") REFERENCES "payment_gateway"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_8fbffcf42dd2aed246ba60cee63') THEN
          ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_8fbffcf42dd2aed246ba60cee63" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_68491493ba4ef63c564ee84242d') THEN
          ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_68491493ba4ef63c564ee84242d" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_a1a4edb3c3a84daba6fdfc2c081') THEN
          ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_a1a4edb3c3a84daba6fdfc2c081" FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_46a5a955f1d35f07161a6494c0a') THEN
          ALTER TABLE "learning_module_section" ADD CONSTRAINT "FK_46a5a955f1d35f07161a6494c0a" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_34899815c25c1c52690e6dfd6f0') THEN
          ALTER TABLE "learning_module" ADD CONSTRAINT "FK_34899815c25c1c52690e6dfd6f0" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_951de844e26a1023106ddc1b069') THEN
          ALTER TABLE "learning_module" ADD CONSTRAINT "FK_951de844e26a1023106ddc1b069" FOREIGN KEY ("sectionId") REFERENCES "learning_module_section"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_9185a45947c2fed7c73fda2d303') THEN
          ALTER TABLE "module_completion" ADD CONSTRAINT "FK_9185a45947c2fed7c73fda2d303" FOREIGN KEY ("module_id") REFERENCES "learning_module"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_b1614eb3e81fefa6f595fb8b5da') THEN
          ALTER TABLE "module_completion" ADD CONSTRAINT "FK_b1614eb3e81fefa6f595fb8b5da" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_29e590514f9941296f3a2440d39') THEN
          ALTER TABLE "cart_item" ADD CONSTRAINT "FK_29e590514f9941296f3a2440d39" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_d351c526fb2245e761711d9f2b4') THEN
          ALTER TABLE "announcement" ADD CONSTRAINT "FK_d351c526fb2245e761711d9f2b4" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP CONSTRAINT IF EXISTS "FK_d351c526fb2245e761711d9f2b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_item" DROP CONSTRAINT IF EXISTS "FK_29e590514f9941296f3a2440d39"`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_completion" DROP CONSTRAINT IF EXISTS "FK_b1614eb3e81fefa6f595fb8b5da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_completion" DROP CONSTRAINT IF EXISTS "FK_9185a45947c2fed7c73fda2d303"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP CONSTRAINT IF EXISTS "FK_951de844e26a1023106ddc1b069"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP CONSTRAINT IF EXISTS "FK_34899815c25c1c52690e6dfd6f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module_section" DROP CONSTRAINT IF EXISTS "FK_46a5a955f1d35f07161a6494c0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" DROP CONSTRAINT IF EXISTS "FK_a1a4edb3c3a84daba6fdfc2c081"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" DROP CONSTRAINT IF EXISTS "FK_68491493ba4ef63c564ee84242d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" DROP CONSTRAINT IF EXISTS "FK_8fbffcf42dd2aed246ba60cee63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" DROP CONSTRAINT IF EXISTS "FK_d1644874e2d361c4d2e3053ef07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "FK_455b676ff4827528174f4369a6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "FK_f7c11d71265b46bca3b920e29a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway_credentials" DROP CONSTRAINT IF EXISTS "FK_8d1db54d80be44ea6aaa2f5a279"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" DROP CONSTRAINT IF EXISTS "FK_558a7ab17d9528ec4ec0adec6dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" DROP CONSTRAINT IF EXISTS "FK_9d22a4c3df301634fdb24ea1a3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" DROP CONSTRAINT IF EXISTS "FK_213183636ad30d9527e781a9f20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance" DROP CONSTRAINT IF EXISTS "FK_517e75cc71ebeb789db33934e39"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT IF EXISTS "FK_12fec8981c30ecef4932627c260"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submission" DROP CONSTRAINT IF EXISTS "FK_ef99745f278ca701c5efe5d8ddd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "submission" DROP CONSTRAINT IF EXISTS "FK_a174d175dc504dce8df5c217014"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_credentials" DROP CONSTRAINT IF EXISTS "FK_444404b6aee45cacead41a12315"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" DROP CONSTRAINT IF EXISTS "FK_12e44d31d176b2300c018e9860d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" DROP CONSTRAINT IF EXISTS "FK_1069de1d429a70aca1801c2add7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "FK_e8c5cf11cac792aeab5d0db5696"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "FK_7bda5d51a1b3da5c8246fcbcbb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_schedule" DROP CONSTRAINT IF EXISTS "FK_05aeba08a8d17392036d9292db1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP CONSTRAINT IF EXISTS "FK_7829063e3cf13c3d684416bd258"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" DROP CONSTRAINT IF EXISTS "FK_f572b5a1782577dfc12c7a99ba0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "FK_75e2be4ce11d447ef43be0e374f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rate" DROP CONSTRAINT IF EXISTS "UQ_8b175b27d8dd0e05d7a793a9b43"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_6f59e5ff429f28f48e37d26204"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_e02da6a28440ff009cd1f62511"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_4c5b32b563e11a3a7700b50e4a"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_756f53ab9466eb52a52619ee01"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_aae147f9a912e8a2dcd69d14eb"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_29e590514f9941296f3a2440d3"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_b1614eb3e81fefa6f595fb8b5d"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_9185a45947c2fed7c73fda2d30"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_187aaac7bf1e8e7a06cbb0c9ca"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_a2ed43097e015a86f92c633273"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_6016e900fd479cc96fb38a0073"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_68491493ba4ef63c564ee84242"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_8fbffcf42dd2aed246ba60cee6"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_d1644874e2d361c4d2e3053ef0"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_d7f13295d0478884f4da37f53e"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_66da32c33acd364a777ac44f51"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_cd564ee5eca8208abfc3e844b1"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_a7564a78ed154d2f0735f92638"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_d7bed97fb47876e03fd7d7c285"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_c4020657e7c74f2820a38daa76"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_04a58564ad172e19f4ba1ca5d3"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_05aeba08a8d17392036d9292db"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_36d4f648e4fa4248f338c1260a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "batch_term" ALTER COLUMN "display_order" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP COLUMN "bodyHtml"`,
    );
    await queryRunner.query(`ALTER TABLE "announcement" ADD "bodyHtml" text`);
    await queryRunner.query(
      `ALTER TABLE "module_completion" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_completion" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP COLUMN "zoom_meeting_password"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" ADD "zoom_meeting_password" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP COLUMN "zoom_meeting_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" ADD "zoom_meeting_url" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP COLUMN "groupId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" ADD "groupId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" DROP COLUMN "contentHtml"`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" ADD "contentHtml" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway" ALTER COLUMN "sortOrder" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway" ALTER COLUMN "processingFeeType" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway" ALTER COLUMN "processingFee" SET DEFAULT 0.0000`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway" ALTER COLUMN "processingFee" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ALTER COLUMN "studentId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN "paymentMethod"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."invoice_paymentmethod_enum"`);
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD "paymentMethod" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ALTER COLUMN "generatedDate" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."invoice_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD "status" character varying NOT NULL DEFAULT 'draft'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway_credentials" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway_credentials" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ALTER COLUMN "status" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assignment_type_enum_old" AS ENUM('assignment', 'exam', 'quiz', 'project')`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ALTER COLUMN "type" TYPE "public"."assignment_type_enum_old" USING "type"::"text"::"public"."assignment_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."assignment_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."assignment_type_enum_old" RENAME TO "assignment_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "UQ_e8c5cf11cac792aeab5d0db5696"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "UQ_7bda5d51a1b3da5c8246fcbcbb8"`,
    );
    await queryRunner.query(`ALTER TABLE "class" DROP COLUMN "classMode"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."class_classmode_enum"`);
    await queryRunner.query(
      `ALTER TABLE "class" ADD "classMode" character varying(20) DEFAULT 'virtual'`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ALTER COLUMN "feePKR" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ALTER COLUMN "feeUSD" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_schedule" DROP COLUMN "endTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_schedule" ADD "endTime" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_schedule" DROP COLUMN "startTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_schedule" ADD "startTime" character varying NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."weekday_enum_old" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_schedule" ALTER COLUMN "weekday" TYPE "public"."weekday_enum_old" USING "weekday"::"text"::"public"."weekday_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."class_schedule_weekday_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."weekday_enum_old" RENAME TO "weekday_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" DROP CONSTRAINT IF EXISTS "UQ_f572b5a1782577dfc12c7a99ba0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" ALTER COLUMN "displayOrder" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "contextId"`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD "contextId" character varying(255) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "contextType"`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD "contextType" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "uploadedAt" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "uploadedBy"`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD "uploadedBy" character varying(255) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "mimeType"`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD "mimeType" character varying(100) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "url"`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD "url" character varying(500)`,
    );
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "path"`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD "path" character varying(500) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "originalName"`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD "originalName" character varying(255) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "filename"`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD "filename" character varying(255) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "classId"`);
    await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "discountType"`);
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN "discountAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP COLUMN "originalPrice"`,
    );
    await queryRunner.query(`ALTER TABLE "performance" DROP COLUMN "class_id"`);
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "aiBaseUrl" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "aiModel" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "claudeApiKey" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "openaiApiKey" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "aiProvider" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "aiEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "module_completion" ADD CONSTRAINT "uq_student_module" UNIQUE ("student_id", "module_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rate" ADD CONSTRAINT "UQ_currency_rate_date_base" UNIQUE ("date", "base")`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "class_classMode_check" CHECK ((("classMode")::text = ANY ((ARRAY['virtual'::character varying, 'in-person'::character varying])::text[])))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_batch_term_is_active" ON "batch_term" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_batch_term_name" ON "batch_term" ("name") WHERE (deleted_at IS NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_sessionId" ON "cart" ("sessionId") WHERE ("sessionId" IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_userId" ON "cart" ("userId") WHERE ("userId" IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_item_classId" ON "cart_item" ("classId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cart_item_cartId" ON "cart_item" ("cartId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_learning_module_zoom_meeting" ON "learning_module" ("zoom_meeting_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_learning_module_is_pinned" ON "learning_module" ("is_pinned") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_learning_module_is_previewable" ON "learning_module" ("is_previewable") WHERE (is_previewable = true)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_gateway_default" ON "payment_gateway" ("isDefault") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_gateway_active" ON "payment_gateway" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_gateway_name" ON "payment_gateway" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_transaction_status" ON "payment_transaction" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_transaction_student" ON "payment_transaction" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_transaction_invoice" ON "payment_transaction" ("invoiceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_transaction_gateway" ON "payment_transaction" ("gatewayId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_transaction_gateway_id" ON "payment_transaction" ("gatewayTransactionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_transaction_id" ON "payment_transaction" ("transactionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoice_dueDate" ON "invoice" ("dueDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoice_status" ON "invoice" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoice_parentId" ON "invoice" ("parentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoice_studentId" ON "invoice" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invoice_invoiceNumber" ON "invoice" ("invoiceNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_gateway_credentials_environment" ON "payment_gateway_credentials" ("environment") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_gateway_credentials_gateway" ON "payment_gateway_credentials" ("gatewayId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_teacher_commission_due_date" ON "teacher_commission" ("dueDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_teacher_commission_student" ON "teacher_commission" ("studentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_teacher_commission_class" ON "teacher_commission" ("classId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_teacher_commission_teacher" ON "teacher_commission" ("teacherId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_teacher_commission_status" ON "teacher_commission" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_assignment_teacher" ON "assignment" ("teacherId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_zoom_credentials_teacher_id" ON "zoom_credentials" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_zoom_meetings_start_time" ON "zoom_meetings" ("start_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_zoom_meetings_status" ON "zoom_meetings" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_zoom_meetings_teacher_id" ON "zoom_meetings" ("teacher_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_zoom_meetings_class_id" ON "zoom_meetings" ("class_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_cover_image_file_id" ON "class" ("cover_image_file_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_thumbnail_file_id" ON "class" ("thumbnail_file_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_is_public_for_sale" ON "class" ("is_public_for_sale") WHERE (is_public_for_sale = true)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_schedule_active" ON "class_schedule" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_schedule_weekday" ON "class_schedule" ("weekday") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_schedule_class_id" ON "class_schedule" ("classId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FILES_UPLOADED_BY" ON "files" ("uploadedBy") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FILES_UPLOADED_AT" ON "files" ("uploadedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_FILES_CONTEXT" ON "files" ("contextType", "contextId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD CONSTRAINT "FK_d351c526fb2245e761711d9f2b4" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_item" ADD CONSTRAINT "FK_cart_item_cart" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" ADD CONSTRAINT "FK_34899815c25c1c52690e6dfd6f0" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" ADD CONSTRAINT "FK_learning_module_zoom_meeting" FOREIGN KEY ("zoom_meeting_id") REFERENCES "zoom_meetings"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module" ADD CONSTRAINT "FK_951de844e26a1023106ddc1b069" FOREIGN KEY ("sectionId") REFERENCES "learning_module_section"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "learning_module_section" ADD CONSTRAINT "FK_46a5a955f1d35f07161a6494c0a" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_payment_transaction_gateway" FOREIGN KEY ("gatewayId") REFERENCES "payment_gateway"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_payment_transaction_invoice" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_payment_transaction_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_payment_transaction_parent" FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD CONSTRAINT "FK_invoice_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD CONSTRAINT "FK_invoice_parent" FOREIGN KEY ("parentId") REFERENCES "parent"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_gateway_credentials" ADD CONSTRAINT "FK_payment_gateway_credentials_gateway" FOREIGN KEY ("gatewayId") REFERENCES "payment_gateway"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" ADD CONSTRAINT "FK_teacher_commission_teacher" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" ADD CONSTRAINT "FK_teacher_commission_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_commission" ADD CONSTRAINT "FK_teacher_commission_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_assignment_teacher" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "submission" ADD CONSTRAINT "FK_submission_student" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "submission" ADD CONSTRAINT "FK_submission_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_credentials" ADD CONSTRAINT "FK_zoom_credentials_teacher_id" FOREIGN KEY ("teacher_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" ADD CONSTRAINT "FK_zoom_meetings_class_id" FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "zoom_meetings" ADD CONSTRAINT "FK_zoom_meetings_teacher_id" FOREIGN KEY ("teacher_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_class_thumbnail_file" FOREIGN KEY ("thumbnail_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_class_cover_image_file" FOREIGN KEY ("cover_image_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_schedule" ADD CONSTRAINT "FK_class_schedule_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD CONSTRAINT "FK_7829063e3cf13c3d684416bd258" FOREIGN KEY ("photoId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher" ADD CONSTRAINT "FK_teacher_photo" FOREIGN KEY ("photoId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_75e2be4ce11d447ef43be0e374f" FOREIGN KEY ("photoId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
