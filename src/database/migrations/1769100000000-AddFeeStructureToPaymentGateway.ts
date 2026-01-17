import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeeStructureToPaymentGateway1769100000000
  implements MigrationInterface
{
  name = 'AddFeeStructureToPaymentGateway1769100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add feeStructure JSONB column to payment_gateway table
    await queryRunner.query(`
      ALTER TABLE "payment_gateway" 
      ADD COLUMN IF NOT EXISTS "feeStructure" jsonb
    `);

    // Update Stripe fee structure: 3% + $1 USD / transaction
    await queryRunner.query(`
      UPDATE "payment_gateway" 
      SET "feeStructure" = '{
        "type": "composite",
        "displayText": "3% + $1 USD / transaction",
        "fees": [
          {"type": "percentage", "value": 3, "label": "Processing Fee"},
          {"type": "fixed", "value": 1, "currency": "USD", "label": "Transaction Fee"}
        ]
      }'::jsonb
      WHERE "name" = 'stripe'
    `);

    // Update Safepay fee structure: 2.9% + Rs 30/transaction
    await queryRunner.query(`
      UPDATE "payment_gateway" 
      SET "feeStructure" = '{
        "type": "composite",
        "displayText": "2.9% + Rs 30 / transaction",
        "fees": [
          {"type": "percentage", "value": 2.9, "label": "Processing Fee"},
          {"type": "fixed", "value": 30, "currency": "PKR", "label": "Transaction Fee"}
        ]
      }'::jsonb
      WHERE "name" = 'safepay'
    `);

    // Update PayFast fee structure: MDR segregation with multiple tiers
    await queryRunner.query(`
      UPDATE "payment_gateway" 
      SET "feeStructure" = '{
        "type": "tiered",
        "displayText": "MDR varies by payment method",
        "tiers": [
          {"method": "RAAST QR", "percentage": 0.60, "description": "Quick Response payments via RAAST"},
          {"method": "RAAST RTP", "percentage": 0.95, "description": "Request To Pay via RAAST"},
          {"method": "Bank Accounts", "percentage": 2.20, "description": "Direct bank account transfers"},
          {"method": "Wallets", "percentage": 2.20, "description": "Mobile wallet payments"},
          {"method": "Cards (Local)", "percentage": 2.95, "description": "Local debit & credit cards"},
          {"method": "Cards (International)", "percentage": 3.50, "description": "International debit & credit cards"}
        ]
      }'::jsonb
      WHERE "name" = 'payfast'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove feeStructure column
    await queryRunner.query(`
      ALTER TABLE "payment_gateway" 
      DROP COLUMN IF EXISTS "feeStructure"
    `);
  }
}
