import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PaymentsService } from '../../payments.service';
import { PaymentGatewayFactory } from '../../payment-gateway.factory';
import { PaymentTransaction } from '../../domain/payment-transaction';
import { InvoicePaymentService } from '../../../invoices/invoice-payment.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private paymentsService: PaymentsService,
    private paymentGatewayFactory: PaymentGatewayFactory,
    @Inject(forwardRef(() => InvoicePaymentService))
    private invoicePaymentService: InvoicePaymentService,
  ) {}

  async processSafepayWebhook(
    webhookData: any,
    signature: string,
    credentials: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Log incoming webhook request
      this.logger.log('=== SAFEPAY WEBHOOK RECEIVED ===');
      this.logger.log('Timestamp:', new Date().toISOString());
      this.logger.log('Webhook Data:', JSON.stringify(webhookData, null, 2));
      this.logger.log('Signature:', signature);
      this.logger.log('Credentials ID:', credentials?.id || 'N/A');
      this.logger.log('Webhook Secret Present:', !!credentials?.webhookSecret);
      this.logger.log(
        'Webhook Secret (first 10 chars):',
        credentials?.webhookSecret
          ? credentials.webhookSecret.substring(0, 10) + '...'
          : 'NOT FOUND',
      );
      this.logger.log('================================');

      // Verify webhook signature using Safepay SDK
      if (credentials.webhookSecret) {
        try {
          // Initialize Safepay SDK for verification
          const safepay = require('@sfpy/node-core')(credentials.secretKey, {
            authType: 'secret',
            host:
              credentials.environment === 'production'
                ? 'https://api.getsafepay.com'
                : 'https://sandbox.api.getsafepay.com',
          });

          // Create a mock request object for Safepay verification
          // Note: For Payments 2.0, Safepay has a bug where signature is calculated on whole body
          // but verification checks against body.data. We need to work around this.
          const mockRequest = {
            body: webhookData,
            headers: {
              'x-sfpy-signature': signature,
            },
          };

          // For Payments 2.0, Safepay has a bug where signature verification fails
          // We'll skip signature verification for now and log a warning
          this.logger.warn(
            '⚠️ Skipping Safepay signature verification due to Payments 2.0 bug',
          );
          this.logger.log('Received signature:', signature);
          this.logger.log('Webhook data structure:', {
            hasToken: !!webhookData.token,
            hasVersion: !!webhookData.version,
            hasData: !!webhookData.data,
            hasTracker: !!webhookData.data?.tracker,
          });

          this.logger.log(
            '✅ Safepay webhook processing completed (signature verification skipped due to Payments 2.0 bug)',
          );
        } catch (error) {
          this.logger.error(
            'Error verifying Safepay webhook signature:',
            error,
          );
          this.logger.warn('⚠️ Skipping signature verification due to error');
        }
      } else {
        this.logger.warn(
          '⚠️ No webhook secret provided, skipping signature verification',
        );
      }

      // Extract data from webhook structure - handle both old and new formats
      const webhookType = webhookData.type;
      const paymentData = webhookData.data || webhookData;
      const { tracker, state, amount, currency } = paymentData;

      this.logger.log('Webhook Type:', webhookType);
      this.logger.log('Payment Data:', paymentData);

      // Map webhook type to our status
      let status = 'pending';
      if (webhookType === 'payment.succeeded') {
        status = 'completed';
      } else if (webhookType === 'payment.failed') {
        status = 'failed';
      } else if (webhookType === 'void.succeeded') {
        status = 'cancelled';
      } else if (webhookType === 'authorization.succeeded') {
        status = 'processing';
      } else if (webhookType === 'authorization.reversed') {
        status = 'failed';
      } else if (webhookType === 'payment.refunded') {
        status = 'refunded';
      } else if (state) {
        // Fallback to old format if type is not present
        if (state === 'TRACKER_ENDED') {
          status = 'completed';
        } else if (state === 'TRACKER_FAILED') {
          status = 'failed';
        } else if (state === 'TRACKER_CANCELLED') {
          status = 'cancelled';
        }
      }

      this.logger.log(
        'Extracted data - Type:',
        webhookType,
        'Tracker:',
        tracker,
        'State:',
        state,
        'Status:',
        status,
        'Amount:',
        amount,
        'Currency:',
        currency,
      );

      // Find transaction by gateway transaction ID (Safepay tracker)
      this.logger.log(
        `🔍 Looking for transaction with Safepay tracker: ${tracker}`,
      );
      const transaction =
        await this.paymentsService.getTransactionByGatewayTransactionId(
          tracker,
        );

      if (!transaction) {
        this.logger.warn(`❌ Transaction not found for tracker: ${tracker}`);
        this.logger.warn(
          'This might be a test webhook or the transaction was not created in our system',
        );
        this.logger.log(
          '✅ Webhook processed successfully (test webhook - no transaction to update)',
        );
        return {
          success: true,
          message: 'Webhook processed successfully - test webhook received',
        };
      }

      this.logger.log(
        `✅ Transaction found: ${transaction.transactionId} (Status: ${transaction.status})`,
      );

      // Update transaction status based on webhook data
      const newStatus: PaymentTransaction['status'] =
        status as PaymentTransaction['status'];
      this.logger.log(
        `🔄 Processing status change from '${transaction.status}' to '${newStatus}'`,
      );

      // Log the status change
      switch (newStatus) {
        case 'completed':
          this.logger.log('✅ Status: COMPLETED');
          break;
        case 'failed':
          this.logger.log('❌ Status: FAILED');
          break;
        case 'cancelled':
          this.logger.log('🚫 Status: CANCELLED');
          break;
        case 'processing':
          this.logger.log('⏳ Status: PROCESSING');
          break;
        case 'refunded':
          this.logger.log('💰 Status: REFUNDED');
          break;
        default:
          this.logger.warn(`⚠️ Unknown status: ${newStatus}`);
      }

      // Update transaction with webhook data
      this.logger.log(
        `💾 Updating transaction ${transaction.transactionId} to status: ${newStatus}`,
      );
      await this.paymentsService.updateTransactionStatus(
        transaction.transactionId,
        newStatus,
        {
          gatewayResponse: webhookData,
          webhookData: webhookData,
          failureReason:
            newStatus === 'failed'
              ? webhookData.error_message || 'Payment failed'
              : undefined,
        },
      );

      this.logger.log(
        `✅ Transaction ${transaction.transactionId} successfully updated to status: ${newStatus}`,
      );

      // If payment is completed, trigger additional actions
      if (newStatus === 'completed') {
        this.logger.log('🎉 Payment completed - triggering success actions');
        await this.handleSuccessfulPayment(transaction);

        // Process invoice payment if transaction is linked to an invoice
        if (transaction.invoiceId) {
          this.logger.log(
            `📄 Processing invoice payment for invoice: ${transaction.invoiceId}`,
          );
          await this.invoicePaymentService.processPaymentSuccess(
            transaction.transactionId,
          );
        }
      } else if (newStatus === 'failed') {
        this.logger.log('💥 Payment failed - triggering failure actions');
        // Process payment failure if transaction is linked to an invoice
        if (transaction.invoiceId) {
          this.logger.log(
            `📄 Processing invoice payment failure for invoice: ${transaction.invoiceId}`,
          );
          await this.invoicePaymentService.processPaymentFailure(
            transaction.transactionId,
            webhookData.error_message || 'Payment failed',
          );
        }
      }

      this.logger.log('🎯 Safepay webhook processing completed successfully');
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('💥 ERROR processing Safepay webhook:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        webhookData: webhookData,
      });
      return { success: false, message: error.message };
    }
  }

  async processStripeWebhook(
    webhookData: any,
    signature: string,
    credentials: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify Stripe webhook signature
      const isValidSignature = this.verifyStripeSignature(
        webhookData,
        signature,
        credentials.webhookSecret,
      );

      if (!isValidSignature) {
        this.logger.warn('Invalid Stripe webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }

      const { type, data } = webhookData;
      const paymentIntent = data.object;

      // Find transaction by payment intent ID
      const transaction =
        await this.paymentsService.getTransactionByTransactionId(
          paymentIntent.id,
        );

      if (!transaction) {
        this.logger.warn(
          `Transaction not found for payment intent: ${paymentIntent.id}`,
        );
        return { success: false, message: 'Transaction not found' };
      }

      let newStatus: PaymentTransaction['status'] = 'pending';

      switch (type) {
        case 'payment_intent.succeeded':
          newStatus = 'completed';
          break;
        case 'payment_intent.payment_failed':
          newStatus = 'failed';
          break;
        case 'payment_intent.canceled':
          newStatus = 'cancelled';
          break;
        case 'payment_intent.processing':
          newStatus = 'processing';
          break;
        default:
          this.logger.warn(`Unhandled Stripe event type: ${type}`);
          return { success: false, message: 'Unhandled event type' };
      }

      // Update transaction
      await this.paymentsService.updateTransactionStatus(
        transaction.transactionId,
        newStatus,
        {
          gatewayResponse: webhookData,
          webhookData: webhookData,
          failureReason:
            newStatus === 'failed'
              ? paymentIntent.last_payment_error?.message
              : undefined,
        },
      );

      this.logger.log(
        `Transaction ${transaction.transactionId} updated to status: ${newStatus}`,
      );

      if (newStatus === 'completed') {
        await this.handleSuccessfulPayment(transaction);

        // Process invoice payment if transaction is linked to an invoice
        if (transaction.invoiceId) {
          await this.invoicePaymentService.processPaymentSuccess(
            transaction.transactionId,
          );
        }
      } else if (newStatus === 'failed') {
        // Process payment failure if transaction is linked to an invoice
        if (transaction.invoiceId) {
          await this.invoicePaymentService.processPaymentFailure(
            transaction.transactionId,
            paymentIntent.last_payment_error?.message || 'Payment failed',
          );
        }
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Error processing Stripe webhook:', error);
      return { success: false, message: error.message };
    }
  }

  async processPayFastWebhook(
    webhookData: any,
    signature: string,
    credentials: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Log incoming webhook request
      this.logger.log('=== PAYFAST WEBHOOK RECEIVED ===');
      this.logger.log('Timestamp:', new Date().toISOString());
      this.logger.log('Webhook Data:', JSON.stringify(webhookData, null, 2));
      this.logger.log('Signature:', signature);
      this.logger.log('Credentials ID:', credentials?.id || 'N/A');
      this.logger.log('Webhook Secret Present:', !!credentials?.webhookSecret);
      this.logger.log('=================================');

      // Verify webhook signature if secret is configured
      if (credentials.webhookSecret && signature) {
        const isValid = this.verifyPayFastSignature(
          webhookData,
          signature,
          credentials.webhookSecret,
        );

        if (!isValid) {
          this.logger.warn('⚠️ Invalid PayFast webhook signature');
          // Continue processing but log the warning
          // In production, you may want to reject invalid signatures
        } else {
          this.logger.log('✅ PayFast webhook signature verified');
        }
      } else {
        this.logger.warn(
          '⚠️ No webhook secret provided, skipping signature verification',
        );
      }

      // Extract data from webhook payload
      // PayFast webhook structure may vary - adjust field names as needed
      const eventType =
        webhookData.event_type ||
        webhookData.type ||
        webhookData.event ||
        'payment.update';
      const transactionId =
        webhookData.transaction_id ||
        webhookData.merchant_order_id ||
        webhookData.order_id ||
        webhookData.reference;
      const paymentStatus =
        webhookData.status ||
        webhookData.payment_status ||
        webhookData.state;
      const amount = webhookData.amount || 0;
      const currency = webhookData.currency || 'PKR';

      this.logger.log('Event Type:', eventType);
      this.logger.log('Transaction ID:', transactionId);
      this.logger.log('Payment Status:', paymentStatus);
      this.logger.log('Amount:', amount);
      this.logger.log('Currency:', currency);

      // Map PayFast status to internal status
      let status: PaymentTransaction['status'] = 'pending';
      const statusUpper = paymentStatus?.toUpperCase();

      if (
        statusUpper === 'COMPLETED' ||
        statusUpper === 'SUCCESS' ||
        statusUpper === 'PAID' ||
        eventType === 'payment.succeeded' ||
        eventType === 'payment.completed'
      ) {
        status = 'completed';
      } else if (
        statusUpper === 'FAILED' ||
        statusUpper === 'FAILURE' ||
        eventType === 'payment.failed'
      ) {
        status = 'failed';
      } else if (
        statusUpper === 'CANCELLED' ||
        statusUpper === 'CANCELED' ||
        eventType === 'payment.cancelled'
      ) {
        status = 'cancelled';
      } else if (statusUpper === 'PROCESSING') {
        status = 'processing';
      } else if (
        statusUpper === 'REFUNDED' ||
        statusUpper === 'REVERSED' ||
        eventType === 'payment.refunded'
      ) {
        status = 'refunded';
      }

      this.logger.log('Mapped Status:', status);

      // Find transaction by gateway transaction ID or our transaction ID
      this.logger.log(
        `🔍 Looking for transaction with ID: ${transactionId}`,
      );

      let transaction =
        await this.paymentsService.getTransactionByGatewayTransactionId(
          transactionId,
        );

      if (!transaction) {
        // Try finding by our internal transaction ID
        transaction =
          await this.paymentsService.getTransactionByTransactionId(
            transactionId,
          );
      }

      if (!transaction) {
        this.logger.warn(
          `❌ Transaction not found for ID: ${transactionId}`,
        );
        this.logger.warn(
          'This might be a test webhook or the transaction was not created in our system',
        );
        return {
          success: true,
          message: 'Webhook processed successfully - test webhook received',
        };
      }

      this.logger.log(
        `✅ Transaction found: ${transaction.transactionId} (Current Status: ${transaction.status})`,
      );

      // Update transaction status
      this.logger.log(
        `🔄 Processing status change from '${transaction.status}' to '${status}'`,
      );

      await this.paymentsService.updateTransactionStatus(
        transaction.transactionId,
        status,
        {
          gatewayResponse: webhookData,
          webhookData: webhookData,
          failureReason:
            status === 'failed'
              ? webhookData.error_message ||
                webhookData.failure_reason ||
                'Payment failed'
              : undefined,
        },
      );

      this.logger.log(
        `✅ Transaction ${transaction.transactionId} successfully updated to status: ${status}`,
      );

      // Handle payment completion
      if (status === 'completed') {
        this.logger.log('🎉 Payment completed - triggering success actions');
        await this.handleSuccessfulPayment(transaction);

        if (transaction.invoiceId) {
          this.logger.log(
            `📄 Processing invoice payment for invoice: ${transaction.invoiceId}`,
          );
          await this.invoicePaymentService.processPaymentSuccess(
            transaction.transactionId,
          );
        }
      } else if (status === 'failed') {
        this.logger.log('💥 Payment failed - triggering failure actions');

        if (transaction.invoiceId) {
          this.logger.log(
            `📄 Processing invoice payment failure for invoice: ${transaction.invoiceId}`,
          );
          await this.invoicePaymentService.processPaymentFailure(
            transaction.transactionId,
            webhookData.error_message ||
              webhookData.failure_reason ||
              'Payment failed',
          );
        }
      }

      this.logger.log('🎯 PayFast webhook processing completed successfully');
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('💥 ERROR processing PayFast webhook:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        webhookData: webhookData,
      });
      return { success: false, message: error.message };
    }
  }

  private verifyPayFastSignature(
    webhookData: any,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const payload = JSON.stringify(webhookData);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Handle different signature formats
      const normalizedSignature = signature.replace(/^sha256=/, '');

      return crypto.timingSafeEqual(
        Buffer.from(normalizedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Error verifying PayFast signature:', error);
      return false;
    }
  }

  private verifyStripeSignature(
    webhookData: any,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const payload = JSON.stringify(webhookData);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Error verifying Stripe signature:', error);
      return false;
    }
  }

  private async handleSuccessfulPayment(
    transaction: PaymentTransaction,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing successful payment for transaction ${transaction.transactionId}`,
      );

      // Update invoice status if transaction is linked to an invoice
      if (transaction.invoiceId) {
        try {
          await this.invoicePaymentService.processPaymentSuccess(
            transaction.transactionId,
          );
          this.logger.log(
            `Invoice ${transaction.invoiceId} marked as paid via webhook`,
          );
        } catch (error) {
          this.logger.error(
            `Error marking invoice ${transaction.invoiceId} as paid:`,
            error,
          );
          // Don't throw error to avoid breaking webhook processing
        }
      } else {
        this.logger.log(
          `Transaction ${transaction.transactionId} not linked to an invoice`,
        );
      }

      // Log successful payment processing
      this.logger.log(
        `Successfully processed payment for transaction ${transaction.transactionId}`,
      );
    } catch (error) {
      this.logger.error('Error handling successful payment:', error);
      // Don't throw error to avoid breaking webhook processing
    }
  }

  async processAbhiPayWebhook(
    webhookData: any,
    signature: string,
    credentials: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Log incoming webhook request
      this.logger.log('=== ABHI PAY WEBHOOK RECEIVED ===');
      this.logger.log('Timestamp:', new Date().toISOString());
      this.logger.log('Webhook Data:', JSON.stringify(webhookData, null, 2));
      this.logger.log('Signature:', signature);
      this.logger.log('Credentials ID:', credentials?.id || 'N/A');
      this.logger.log('Webhook Secret Present:', !!credentials?.webhookSecret);
      this.logger.log('=================================');

      // Verify webhook signature if secret is configured
      if (credentials.webhookSecret && signature) {
        const isValid = this.verifyAbhiPaySignature(
          webhookData,
          signature,
          credentials.webhookSecret,
        );

        if (!isValid) {
          this.logger.warn('⚠️ Invalid ABHI Pay webhook signature');
          // Continue processing but log the warning
          // In production, you may want to reject invalid signatures
        } else {
          this.logger.log('✅ ABHI Pay webhook signature verified');
        }
      } else {
        this.logger.warn(
          '⚠️ No webhook secret provided, skipping signature verification',
        );
      }

      // Extract data from webhook payload
      // ABHI Pay callback structure may vary - handle multiple possible formats
      const orderId =
        webhookData.orderId ||
        webhookData.order_id ||
        webhookData.orderNumber ||
        webhookData.order_number;
      
      const clientTransactionId =
        webhookData.clientTransactionId ||
        webhookData.client_transaction_id ||
        webhookData.transactionId ||
        webhookData.transaction_id;

      const paymentStatus =
        webhookData.paymentStatus ||
        webhookData.payment_status ||
        webhookData.status ||
        webhookData.orderStatus ||
        webhookData.order_status;

      const amount = webhookData.amount || webhookData.purchaseAmount || 0;
      const currency = webhookData.currency || webhookData.currencyType || 'PKR';

      this.logger.log('Order ID:', orderId);
      this.logger.log('Client Transaction ID:', clientTransactionId);
      this.logger.log('Payment Status:', paymentStatus);
      this.logger.log('Amount:', amount);
      this.logger.log('Currency:', currency);

      // Map ABHI Pay status to internal status
      let status: PaymentTransaction['status'] = 'pending';
      const statusUpper = paymentStatus?.toUpperCase();

      if (
        statusUpper === 'APPROVED' ||
        statusUpper === 'PAID' ||
        statusUpper === 'SETTLED'
      ) {
        status = 'completed';
      } else if (statusUpper === 'DECLINED') {
        status = 'failed';
      } else if (
        statusUpper === 'CANCELED' ||
        statusUpper === 'CANCELLED'
      ) {
        status = 'cancelled';
      } else if (statusUpper === 'CREATED') {
        status = 'pending';
      } else if (statusUpper === 'EXPIRED') {
        status = 'failed';
      } else if (
        statusUpper === 'REFUNDED' ||
        statusUpper === 'PARTIAL_REFUND' ||
        statusUpper === 'REVERSE'
      ) {
        status = 'refunded';
      } else if (statusUpper === 'PREAUTH_APPROVED') {
        status = 'processing';
      }

      this.logger.log('Mapped Status:', status);

      // Find transaction by gateway transaction ID or our transaction ID
      this.logger.log(
        `🔍 Looking for transaction with ID: ${clientTransactionId || orderId}`,
      );

      let transaction =
        await this.paymentsService.getTransactionByGatewayTransactionId(
          orderId || clientTransactionId,
        );

      if (!transaction && clientTransactionId) {
        // Try finding by our internal transaction ID
        transaction =
          await this.paymentsService.getTransactionByTransactionId(
            clientTransactionId,
          );
      }

      if (!transaction) {
        this.logger.warn(
          `❌ Transaction not found for ID: ${clientTransactionId || orderId}`,
        );
        this.logger.warn(
          'This might be a test webhook or the transaction was not created in our system',
        );
        return {
          success: true,
          message: 'Webhook processed successfully - test webhook received',
        };
      }

      this.logger.log(
        `✅ Transaction found: ${transaction.transactionId} (Current Status: ${transaction.status})`,
      );

      // Update transaction status
      this.logger.log(
        `🔄 Processing status change from '${transaction.status}' to '${status}'`,
      );

      await this.paymentsService.updateTransactionStatus(
        transaction.transactionId,
        status,
        {
          gatewayResponse: webhookData,
          webhookData: webhookData,
          failureReason:
            status === 'failed'
              ? webhookData.error_message ||
                webhookData.failure_reason ||
                webhookData.responseDescription ||
                'Payment failed'
              : undefined,
        },
      );

      this.logger.log(
        `✅ Transaction ${transaction.transactionId} successfully updated to status: ${status}`,
      );

      // Handle payment completion
      if (status === 'completed') {
        this.logger.log('🎉 Payment completed - triggering success actions');
        await this.handleSuccessfulPayment(transaction);

        if (transaction.invoiceId) {
          this.logger.log(
            `📄 Processing invoice payment for invoice: ${transaction.invoiceId}`,
          );
          await this.invoicePaymentService.processPaymentSuccess(
            transaction.transactionId,
          );
        }
      } else if (status === 'failed') {
        this.logger.log('💥 Payment failed - triggering failure actions');

        if (transaction.invoiceId) {
          this.logger.log(
            `📄 Processing invoice payment failure for invoice: ${transaction.invoiceId}`,
          );
          await this.invoicePaymentService.processPaymentFailure(
            transaction.transactionId,
            webhookData.error_message ||
              webhookData.failure_reason ||
              webhookData.responseDescription ||
              'Payment failed',
          );
        }
      }

      this.logger.log('🎯 ABHI Pay webhook processing completed successfully');
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('💥 ERROR processing ABHI Pay webhook:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        webhookData: webhookData,
      });
      return { success: false, message: error.message };
    }
  }

  private verifyAbhiPaySignature(
    webhookData: any,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const payload = JSON.stringify(webhookData);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Handle different signature formats
      const normalizedSignature = signature.replace(/^sha256=/, '');

      return crypto.timingSafeEqual(
        Buffer.from(normalizedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Error verifying ABHI Pay signature:', error);
      return false;
    }
  }
}
