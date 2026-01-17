import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAbhiPayGateway1768700000000 implements MigrationInterface {
  name = 'AddAbhiPayGateway1768700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert ABHI Pay payment gateway
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
        'abhipay', 
        'ABHI Pay', 
        'Secure online payments via ABHI Pay - Cards, 3D Secure, Visa, MasterCard (including foreign cards)', 
        false, 
        false,
        '/assets/payment-gateways/abhipay.png',
        'https://abhipay.com.pk',
        '{"PKR"}',
        '{"PK"}',
        1.00,
        1000000.00,
        0.0295,
        'percentage',
        5,
        '{"fields": [
          {"name": "merchantCode", "type": "text", "required": true, "label": "Merchant Code", "description": "Your ABHI Pay Merchant Code from the dashboard"},
          {"name": "secretKey", "type": "password", "required": true, "label": "Secret Key", "encrypted": true, "description": "Your ABHI Pay Secret Key from the Applications page"},
          {"name": "webhookSecret", "type": "password", "required": false, "label": "Webhook Secret", "encrypted": true, "description": "Secret for webhook signature verification (optional)"},
          {"name": "environment", "type": "select", "required": true, "label": "Environment", "options": [{"value": "sandbox", "label": "Sandbox (Testing)"}, {"value": "production", "label": "Production (Live)"}]}
        ]}',
        true
      )
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove ABHI Pay payment gateway
    await queryRunner.query(`
      DELETE FROM "payment_gateway" WHERE "name" = 'abhipay'
    `);
  }
}
