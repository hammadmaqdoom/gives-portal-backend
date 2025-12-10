-- Fix for CreateSettingsTable1700000000000 migration
-- This script ensures the settings table has all required columns and default data

-- Check and add missing columns
DO $$
BEGIN
    -- Add defaultCurrency if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'settings' 
        AND column_name = 'defaultCurrency'
    ) THEN
        ALTER TABLE "settings" ADD COLUMN "defaultCurrency" character varying(3) DEFAULT 'PKR';
    END IF;

    -- Add file storage columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'fileDriver') THEN
        ALTER TABLE "settings" ADD COLUMN "fileDriver" character varying(32) DEFAULT 'local';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'accessKeyId') THEN
        ALTER TABLE "settings" ADD COLUMN "accessKeyId" character varying(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'secretAccessKey') THEN
        ALTER TABLE "settings" ADD COLUMN "secretAccessKey" character varying(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'awsDefaultS3Bucket') THEN
        ALTER TABLE "settings" ADD COLUMN "awsDefaultS3Bucket" character varying(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'awsS3Region') THEN
        ALTER TABLE "settings" ADD COLUMN "awsS3Region" character varying(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'azureStorageAccountName') THEN
        ALTER TABLE "settings" ADD COLUMN "azureStorageAccountName" character varying(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'azureStorageAccountKey') THEN
        ALTER TABLE "settings" ADD COLUMN "azureStorageAccountKey" character varying(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'azureContainerName') THEN
        ALTER TABLE "settings" ADD COLUMN "azureContainerName" character varying(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'azureBlobSasExpirySeconds') THEN
        ALTER TABLE "settings" ADD COLUMN "azureBlobSasExpirySeconds" integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'azureBlobPublicBaseUrl') THEN
        ALTER TABLE "settings" ADD COLUMN "azureBlobPublicBaseUrl" character varying(500);
    END IF;

    -- Add SMS configuration columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'smsEnabled') THEN
        ALTER TABLE "settings" ADD COLUMN "smsEnabled" boolean NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'smsProvider') THEN
        ALTER TABLE "settings" ADD COLUMN "smsProvider" character varying(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'smsApiEmail') THEN
        ALTER TABLE "settings" ADD COLUMN "smsApiEmail" character varying(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'smsApiKey') THEN
        ALTER TABLE "settings" ADD COLUMN "smsApiKey" character varying(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'smsMask') THEN
        ALTER TABLE "settings" ADD COLUMN "smsMask" character varying(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'smsApiUrl') THEN
        ALTER TABLE "settings" ADD COLUMN "smsApiUrl" character varying(500);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'smsTestMode') THEN
        ALTER TABLE "settings" ADD COLUMN "smsTestMode" boolean NOT NULL DEFAULT true;
    END IF;

    -- Add WhatsApp configuration columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'whatsappEnabled') THEN
        ALTER TABLE "settings" ADD COLUMN "whatsappEnabled" boolean NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'whatsappDeviceId') THEN
        ALTER TABLE "settings" ADD COLUMN "whatsappDeviceId" character varying(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'whatsappApiUrl') THEN
        ALTER TABLE "settings" ADD COLUMN "whatsappApiUrl" character varying(500);
    END IF;
END $$;

-- Insert default settings if none exist
INSERT INTO "settings" (
    "appName", "appTitle", "metaDescription", "defaultTimezone",
    "smtpSecure", "smtpIgnoreTls", "smtpRequireTls"
)
SELECT 
    'LMS Portal',
    'LMS Portal - Education Management System',
    'Comprehensive education management system for schools and institutions',
    'Asia/Karachi',
    false,
    false,
    true
WHERE NOT EXISTS (SELECT 1 FROM "settings");

-- Mark migration as completed (only if not already marked)
INSERT INTO "migrations" ("timestamp", "name")
SELECT 1700000000000, 'CreateSettingsTable1700000000000'
WHERE NOT EXISTS (
    SELECT 1 FROM "migrations" WHERE "name" = 'CreateSettingsTable1700000000000'
);

