import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentGatewayTables1754308080007
  implements MigrationInterface
{
  name = 'CreatePaymentGatewayTables1754308080007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_gateway table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_gateway" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(100) NOT NULL UNIQUE,
        "displayName" varchar(255) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT false,
        "isDefault" boolean NOT NULL DEFAULT false,
        "logoUrl" varchar(500),
        "website" varchar(255),
        "supportedCurrencies" text[] NOT NULL DEFAULT '{}',
        "supportedCountries" text[] NOT NULL DEFAULT '{}',
        "minAmount" decimal(10,2),
        "maxAmount" decimal(10,2),
        "processingFee" decimal(5,4) DEFAULT 0.0000,
        "processingFeeType" varchar(20) DEFAULT 'percentage',
        "sortOrder" integer DEFAULT 0,
        "configSchema" jsonb,
        "webhookUrl" varchar(500),
        "testMode" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" timestamp
      )
    `);

    // Create payment_gateway_credentials table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_gateway_credentials" (
        "id" SERIAL PRIMARY KEY,
        "gatewayId" integer NOT NULL,
        "environment" varchar(20) NOT NULL DEFAULT 'sandbox',
        "apiKey" text NOT NULL,
        "secretKey" text NOT NULL,
        "webhookSecret" text,
        "additionalConfig" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" timestamp
      )
    `);

    // Create payment_transaction table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_transaction" (
        "id" SERIAL PRIMARY KEY,
        "transactionId" varchar(255) NOT NULL UNIQUE,
        "gatewayTransactionId" varchar(255),
        "gatewayId" integer NOT NULL,
        "invoiceId" integer,
        "studentId" integer NOT NULL,
        "parentId" integer,
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'PKR',
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "paymentMethod" varchar(50),
        "gatewayResponse" jsonb,
        "webhookData" jsonb,
        "redirectUrl" varchar(500),
        "callbackUrl" varchar(500),
        "failureReason" text,
        "processedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" timestamp
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_gateway_name" ON "payment_gateway" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_gateway_active" ON "payment_gateway" ("isActive")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_gateway_default" ON "payment_gateway" ("isDefault")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_gateway_credentials_gateway" ON "payment_gateway_credentials" ("gatewayId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_gateway_credentials_environment" ON "payment_gateway_credentials" ("environment")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_id" ON "payment_transaction" ("transactionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_gateway_id" ON "payment_transaction" ("gatewayTransactionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_gateway" ON "payment_transaction" ("gatewayId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_invoice" ON "payment_transaction" ("invoiceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_student" ON "payment_transaction" ("studentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_status" ON "payment_transaction" ("status")`,
    );

    // Add foreign key constraints
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_payment_gateway_credentials_gateway') THEN
          ALTER TABLE "payment_gateway_credentials" 
          ADD CONSTRAINT "FK_payment_gateway_credentials_gateway" 
          FOREIGN KEY ("gatewayId") 
          REFERENCES "payment_gateway"("id") 
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_payment_transaction_gateway') THEN
          ALTER TABLE "payment_transaction" 
          ADD CONSTRAINT "FK_payment_transaction_gateway" 
          FOREIGN KEY ("gatewayId") 
          REFERENCES "payment_gateway"("id") 
          ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_payment_transaction_invoice') THEN
          ALTER TABLE "payment_transaction" 
          ADD CONSTRAINT "FK_payment_transaction_invoice" 
          FOREIGN KEY ("invoiceId") 
          REFERENCES "invoice"("id") 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_payment_transaction_student') THEN
          ALTER TABLE "payment_transaction" 
          ADD CONSTRAINT "FK_payment_transaction_student" 
          FOREIGN KEY ("studentId") 
          REFERENCES "student"("id") 
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_payment_transaction_parent') THEN
          ALTER TABLE "payment_transaction" 
          ADD CONSTRAINT "FK_payment_transaction_parent" 
          FOREIGN KEY ("parentId") 
          REFERENCES "parent"("id") 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Insert default payment gateways
    await queryRunner.query(`
      INSERT INTO "payment_gateway" (
        "name", "displayName", "description", "isActive", "isDefault", 
        "logoUrl", "website", "supportedCurrencies", "supportedCountries",
        "minAmount", "maxAmount", "processingFee", "processingFeeType",
        "sortOrder", "configSchema", "testMode"
      ) VALUES 
      (
        'bank_transfer', 
        'Bank Transfer', 
        'Direct bank transfer to our account', 
        true, 
        true,
        '/assets/payment-gateways/bank-transfer.svg',
        'https://getsafepay.pk',
        '{"PKR", "USD", "EUR"}',
        '{"PK", "US", "GB"}',
        100.00,
        1000000.00,
        0.0000,
        'fixed',
        1,
        '{"fields": [{"name": "bankName", "type": "text", "required": true, "label": "Bank Name"}, {"name": "accountNumber", "type": "text", "required": true, "label": "Account Number"}, {"name": "accountTitle", "type": "text", "required": true, "label": "Account Title"}, {"name": "iban", "type": "text", "required": true, "label": "IBAN"}, {"name": "swiftCode", "type": "text", "required": false, "label": "SWIFT Code"}]}',
        false
      ),
      (
        'safepay', 
        'Safepay', 
        'Secure online payments with Safepay', 
        false, 
        false,
        '/assets/payment-gateways/safepay.svg',
        'https://getsafepay.pk',
        '{"PKR", "USD", "EUR", "GBP"}',
        '{"PK", "US", "GB", "AE"}',
        1.00,
        1000000.00,
        0.0290,
        'percentage',
        2,
        '{"fields": [{"name": "apiKey", "type": "text", "required": true, "label": "API Key", "encrypted": true}, {"name": "secretKey", "type": "password", "required": true, "label": "Secret Key", "encrypted": true}, {"name": "webhookSecret", "type": "password", "required": false, "label": "Webhook Secret", "encrypted": true}, {"name": "environment", "type": "select", "required": true, "label": "Environment", "options": [{"value": "sandbox", "label": "Sandbox"}, {"value": "production", "label": "Production"}]}]}',
        true
      ),
      (
        'stripe', 
        'Stripe', 
        'Online payments with Stripe', 
        false, 
        false,
        '/assets/payment-gateways/stripe.svg',
        'https://stripe.com',
        '{"USD", "EUR", "GBP", "CAD", "AUD"}',
        '{"US", "GB", "CA", "AU", "DE", "FR"}',
        0.50,
        999999.99,
        0.0290,
        'percentage',
        3,
        '{"fields": [{"name": "publishableKey", "type": "text", "required": true, "label": "Publishable Key"}, {"name": "secretKey", "type": "password", "required": true, "label": "Secret Key", "encrypted": true}, {"name": "webhookSecret", "type": "password", "required": false, "label": "Webhook Secret", "encrypted": true}, {"name": "environment", "type": "select", "required": true, "label": "Environment", "options": [{"value": "test", "label": "Test"}, {"value": "live", "label": "Live"}]}]}',
        true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
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
      `ALTER TABLE "payment_gateway_credentials" DROP CONSTRAINT IF EXISTS "FK_payment_gateway_credentials_gateway"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_transaction"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "payment_gateway_credentials"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_gateway"`);
  }
}
