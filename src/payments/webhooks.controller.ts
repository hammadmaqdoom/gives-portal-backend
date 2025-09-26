import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  Request,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookService } from './infrastructure/webhooks/webhook.service';
import { PaymentsService } from './payments.service';

@ApiTags('Webhooks')
@Controller({
  path: 'webhooks',
  version: '1',
})
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('safepay')
  @ApiOperation({ summary: 'Safepay webhook endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  async handleSafepayWebhook(
    @Body() webhookData: any,
    @Headers() headers: any,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    // Log incoming webhook request
    this.logger.log('=== SAFEPAY WEBHOOK REQUEST RECEIVED ===');
    this.logger.log('Timestamp:', new Date().toISOString());
    this.logger.log('IP Address:', req.ip || req.connection?.remoteAddress);
    this.logger.log('User Agent:', req.headers['user-agent']);
    this.logger.log('Headers:', JSON.stringify(headers, null, 2));
    this.logger.log('Body:', JSON.stringify(webhookData, null, 2));
    this.logger.log('==========================================');

    try {
      // Get Safepay gateway
      const gateway = await this.paymentsService.findByName('safepay');
      if (!gateway) {
        this.logger.error('❌ Safepay gateway not found');
        return { success: false, message: 'Safepay gateway not found' };
      }

      // Get active credentials
      const credentials = await this.paymentsService.getActiveCredentials(gateway.id);
      if (!credentials) {
        this.logger.error('❌ Safepay credentials not found');
        return { success: false, message: 'Safepay credentials not found' };
      }

      this.logger.log('✅ Safepay gateway and credentials found, processing webhook');
      this.logger.log('Credentials details:', {
        id: credentials.id,
        environment: credentials.environment,
        hasApiKey: !!credentials.apiKey,
        hasSecretKey: !!credentials.secretKey,
        hasWebhookSecret: !!credentials.webhookSecret,
        webhookSecretPreview: credentials.webhookSecret ? credentials.webhookSecret.substring(0, 10) + '...' : 'NOT FOUND'
      });

      // Process the webhook
      const safepaySignature = headers['x-sfpy-signature'];
      
      this.logger.log('Available headers:', Object.keys(headers));
      this.logger.log('Signature found:', safepaySignature);
      
      return await this.webhookService.processSafepayWebhook(
        webhookData,
        safepaySignature,
        credentials,
      );
    } catch (error) {
      this.logger.error('💥 ERROR processing Safepay webhook:', error);
      return { success: false, message: error.message };
    }
  }

  @Post('stripe')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  async handleStripeWebhook(
    @Body() webhookData: any,
    @Headers() headers: any,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    // Log incoming webhook request
    this.logger.log('=== STRIPE WEBHOOK REQUEST RECEIVED ===');
    this.logger.log('Timestamp:', new Date().toISOString());
    this.logger.log('IP Address:', req.ip || req.connection?.remoteAddress);
    this.logger.log('User Agent:', req.headers['user-agent']);
    this.logger.log('Headers:', JSON.stringify(headers, null, 2));
    this.logger.log('Body:', JSON.stringify(webhookData, null, 2));
    this.logger.log('======================================');

    try {
      // Get Stripe gateway
      const gateway = await this.paymentsService.findByName('stripe');
      if (!gateway) {
        this.logger.error('❌ Stripe gateway not found');
        return { success: false, message: 'Stripe gateway not found' };
      }

      // Get active credentials
      const credentials = await this.paymentsService.getActiveCredentials(gateway.id);
      if (!credentials) {
        this.logger.error('❌ Stripe credentials not found');
        return { success: false, message: 'Stripe credentials not found' };
      }

      this.logger.log('✅ Stripe gateway and credentials found, processing webhook');

      // Process the webhook
      const stripeSignature = headers['stripe-signature'];
      return await this.webhookService.processStripeWebhook(
        webhookData,
        stripeSignature,
        credentials,
      );
    } catch (error) {
      this.logger.error('💥 ERROR processing Stripe webhook:', error);
      return { success: false, message: error.message };
    }
  }
}
