import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayFastGateway1768603651000 implements MigrationInterface {
  name = 'AddPayFastGateway1768603651000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert PayFast payment gateway
    await queryRunner.query(`
      INSERT INTO "payment_gateway" (
        "name", 
        "displayName", 
        "description", 
        "isActive", 
        "isDefault", 
        "logoUrl", 
        "website",
        "supportedCurrencies", 
        "supportedCountries",
        "minAmount", 
        "maxAmount", 
        "processingFee", 
        "processingFeeType",
        "sortOrder", 
        "configSchema", 
        "testMode"
      ) VALUES (
        'payfast', 
        'PayFast', 
        'Secure payments via PayFast - Cards, Bank Accounts, Wallets, and Raast P2M', 
        false, 
        false,
        '/assets/payment-gateways/payfast.png',
        'https://gopayfast.com',
        '{"PKR"}',
        '{"PK"}',
        10.00,
        1000000.00,
        0.0295,
        'percentage',
        4,
        '{"fields": [
          {"name": "merchantId", "type": "text", "required": true, "label": "Merchant ID", "description": "Your PayFast Merchant ID"},
          {"name": "securedKey", "type": "password", "required": true, "label": "Secured Key", "encrypted": true, "description": "Your PayFast Secured Key"},
          {"name": "webhookSecret", "type": "password", "required": false, "label": "Webhook Secret", "encrypted": true, "description": "Secret for webhook signature verification"},
          {"name": "environment", "type": "select", "required": true, "label": "Environment", "options": [{"value": "sandbox", "label": "Sandbox (Testing)"}, {"value": "production", "label": "Production (Live)"}]},
          {"name": "sandboxUrl", "type": "text", "required": false, "label": "Sandbox API URL", "description": "PayFast Sandbox API URL", "default": "https://sandbox.gopayfast.com/api"},
          {"name": "productionUrl", "type": "text", "required": false, "label": "Production API URL", "description": "PayFast Production API URL", "default": "https://api.gopayfast.com/api"}
        ]}',
        true
      )
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove PayFast payment gateway
    await queryRunner.query(`
      DELETE FROM "payment_gateway" WHERE "name" = 'payfast'
    `);
  }
}
