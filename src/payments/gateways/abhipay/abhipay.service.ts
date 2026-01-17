import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayCredentials } from '../../domain/payment-gateway-credentials';
import { PaymentTransaction } from '../../domain/payment-transaction';
import * as crypto from 'crypto';

interface AbhiPayOrderResponse {
  code: string;
  message: string;
  internalMessage?: string;
  payload: {
    orderId: string;
    paymentUrl: string;
    orderInfo?: any;
  };
}

interface AbhiPayOrderStatusResponse {
  code: string;
  message: string;
  internalMessage?: string;
  payload: {
    orderId: string;
    sessionId: string;
    amount: number;
    currencyType: string;
    merchantName: string;
    commission?: number;
    commissionRate?: number;
    paymentStatus: string;
    auto: boolean;
    createdDate: string;
    description: string;
    transactions?: Array<{
      uuid: string;
      createdDate: string;
      status: string;
      responseDescription?: string;
      channel?: string;
      requestRrn?: string;
      responseRrn?: string;
      cardDetails?: {
        cardHolderName?: string;
        maskedPan?: string;
        brand?: string;
        uuid?: string;
        bankName?: string;
      };
    }>;
  };
}

@Injectable()
export class AbhiPayService {
  private readonly logger = new Logger(AbhiPayService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get the base API URL based on environment
   * ABHI Pay uses the same base URL for both sandbox and production
   * Environment is determined by the merchant credentials
   */
  private getBaseUrl(credentials: PaymentGatewayCredentials): string {
    const config = credentials.additionalConfig || {};
    
    // ABHI Pay uses same base URL, but credentials differ by environment
    return 'https://api.abhipay.com.pk/api/v3';
  }

  /**
   * Create a payment session and return checkout URL
   * Uses ABHI Pay API v3 POST /orders endpoint
   */
  async createPaymentSession(
    transaction: PaymentTransaction,
    credentials: PaymentGatewayCredentials,
    customerInfo?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    },
  ): Promise<{ checkoutUrl: string; sessionToken: string; authToken: string }> {
    try {
      this.logger.log('Creating ABHI Pay payment session');
      this.logger.log('Transaction amount:', transaction.amount);
      this.logger.log('Currency:', transaction.currency);
      this.logger.log('Environment:', credentials.environment);

      const baseUrl = this.getBaseUrl(credentials);

      // Get app URL for callbacks
      const appUrl =
        this.configService.get('APP_URL') ||
        this.configService.get('FRONTEND_DOMAIN') ||
        'http://localhost:3000';

      const callbackUrl = transaction.callbackUrl || `${appUrl}/payment/callback`;
      const webhookUrl = `${appUrl}/api/v1/webhooks/abhipay`;

      this.logger.log('Callback URL:', callbackUrl);
      this.logger.log('Webhook URL:', webhookUrl);

      // Use v3 API for creating orders
      const requestBody = {
        amount: transaction.amount,
        language: 'EN',
        currency: transaction.currency || 'PKR',
        description: `Payment for Transaction ${transaction.transactionId}`,
        clientTransactionId: transaction.transactionId,
        callbackUrl: callbackUrl,
        cardSave: false,
        operation: 'PURCHASE',
      };

      this.logger.log('ABHI Pay request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: credentials.secretKey, // Secret key in Authorization header
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('ABHI Pay order creation failed:', errorText);
        throw new Error(`Order creation failed: ${response.statusText}`);
      }

      const data: AbhiPayOrderResponse = await response.json();

      // Check response code
      if (data.code !== '00000') {
        this.logger.error('ABHI Pay returned error:', data.message || data.internalMessage);
        throw new Error(
          data.message || data.internalMessage || 'Failed to create payment session',
        );
      }

      if (!data.payload || !data.payload.paymentUrl) {
        this.logger.error('ABHI Pay returned invalid response:', data);
        throw new Error('Invalid response from ABHI Pay');
      }

      this.logger.log('ABHI Pay payment session created successfully');
      this.logger.log('Order ID:', data.payload.orderId);
      this.logger.log('Payment URL:', data.payload.paymentUrl);

      return {
        checkoutUrl: data.payload.paymentUrl,
        sessionToken: data.payload.orderId,
        authToken: data.payload.orderId, // Using orderId as auth token
      };
    } catch (error) {
      this.logger.error('ABHI Pay payment session creation failed:', error);
      throw new Error(
        `ABHI Pay payment session creation failed: ${error.message}`,
      );
    }
  }

  /**
   * Verify payment status using orderId
   * Uses ABHI Pay API v3 GET /orders/{orderId} endpoint
   */
  async verifyPayment(
    orderId: string,
    credentials: PaymentGatewayCredentials,
  ): Promise<boolean> {
    try {
      this.logger.log('Verifying ABHI Pay payment:', orderId);

      const baseUrl = this.getBaseUrl(credentials);

      const response = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: credentials.secretKey,
        },
      });

      if (!response.ok) {
        this.logger.error('ABHI Pay status check failed:', response.statusText);
        return false;
      }

      const data: AbhiPayOrderStatusResponse = await response.json();

      if (data.code !== '00000') {
        this.logger.error('ABHI Pay status check error:', data.message);
        return false;
      }

      this.logger.log('ABHI Pay payment status:', data.payload.paymentStatus);

      // Check if payment is completed/successful
      const isCompleted =
        data.payload.paymentStatus === 'APPROVED' ||
        data.payload.paymentStatus === 'PAID' ||
        data.payload.paymentStatus === 'SETTLED';

      return isCompleted;
    } catch (error) {
      this.logger.error('ABHI Pay payment verification failed:', error);
      return false;
    }
  }

  /**
   * Get detailed payment information
   */
  async getPaymentDetails(
    orderId: string,
    credentials: PaymentGatewayCredentials,
  ): Promise<{
    success: boolean;
    status: string;
    message: string;
    transactionData?: any;
  }> {
    try {
      this.logger.log('Getting ABHI Pay payment details:', orderId);

      const baseUrl = this.getBaseUrl(credentials);

      const response = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: credentials.secretKey,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          message: `Failed to get payment details: ${response.statusText}`,
        };
      }

      const data: AbhiPayOrderStatusResponse = await response.json();

      if (data.code !== '00000') {
        return {
          success: false,
          status: 'failed',
          message: data.message || data.internalMessage || 'Failed to get payment details',
        };
      }

      const paymentStatus = data.payload.paymentStatus;
      const isCompleted =
        paymentStatus === 'APPROVED' ||
        paymentStatus === 'PAID' ||
        paymentStatus === 'SETTLED';

      const mappedStatus = this.mapPaymentStatus(paymentStatus);

      return {
        success: isCompleted,
        status: mappedStatus,
        message: isCompleted
          ? 'Payment verified successfully'
          : `Payment status: ${paymentStatus}`,
        transactionData: data.payload,
      };
    } catch (error) {
      this.logger.error('ABHI Pay payment details fetch failed:', error);
      return {
        success: false,
        status: 'failed',
        message: `Payment details fetch failed: ${error.message}`,
      };
    }
  }

  /**
   * Test connection to ABHI Pay API
   */
  async testConnection(credentials: PaymentGatewayCredentials): Promise<boolean> {
    try {
      this.logger.log('Testing ABHI Pay connection');

      // Try to create a test order with minimal amount
      const baseUrl = this.getBaseUrl(credentials);
      const testOrderBody = {
        amount: 1.0,
        language: 'EN',
        currency: 'PKR',
        description: 'Connection test',
        clientTransactionId: `test_${Date.now()}`,
        callbackUrl: 'https://example.com/test',
        cardSave: false,
        operation: 'PURCHASE',
      };

      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: credentials.secretKey,
        },
        body: JSON.stringify(testOrderBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('ABHI Pay connection test failed:', errorText);
        return false;
      }

      const data = await response.json();

      // If we get a valid response (even if it's an error about test credentials), connection works
      if (data.code === '00000' || data.code === '14010') {
        // 14010 is UNAUTHORIZED - means connection works but credentials might be wrong
        this.logger.log('ABHI Pay connection test successful');
        return true;
      }

      this.logger.error('ABHI Pay connection test failed:', data.message);
      return false;
    } catch (error) {
      this.logger.error('ABHI Pay connection test failed:', error);
      return false;
    }
  }

  /**
   * Process webhook/callback notification
   * ABHI Pay sends callbacks to the callbackUrl with payment status
   */
  async processWebhook(
    credentials: PaymentGatewayCredentials,
    webhookData: any,
    signature: string,
  ): Promise<{
    eventType: string;
    transactionId: string;
    status: string;
    amount: number;
    currency: string;
  }> {
    try {
      this.logger.log('Processing ABHI Pay webhook');
      this.logger.log('Webhook data:', JSON.stringify(webhookData, null, 2));

      // Verify webhook signature if webhook secret is configured
      if (credentials.webhookSecret && signature) {
        const isValid = this.verifyWebhookSignature(
          webhookData,
          signature,
          credentials.webhookSecret,
        );

        if (!isValid) {
          this.logger.warn('Invalid ABHI Pay webhook signature');
          throw new Error('Invalid webhook signature');
        }

        this.logger.log('ABHI Pay webhook signature verified');
      } else {
        this.logger.warn(
          'ABHI Pay webhook secret not configured, skipping signature verification',
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
      const status = this.mapPaymentStatus(paymentStatus);

      // Use clientTransactionId as transactionId (our internal transaction ID)
      const transactionId = clientTransactionId || orderId;

      return {
        eventType: this.mapEventType(paymentStatus),
        transactionId,
        status,
        amount,
        currency,
      };
    } catch (error) {
      this.logger.error('ABHI Pay webhook processing failed:', error);
      throw new Error(`ABHI Pay webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Map ABHI Pay payment status to internal status
   */
  private mapPaymentStatus(status: string): string {
    if (!status) return 'pending';

    const statusUpper = status.toUpperCase();
    const statusMap: Record<string, string> = {
      APPROVED: 'completed',
      PAID: 'completed',
      SETTLED: 'completed',
      DECLINED: 'failed',
      CANCELED: 'cancelled',
      CANCELED: 'cancelled',
      CREATED: 'pending',
      EXPIRED: 'failed',
      REFUNDED: 'refunded',
      PARTIAL_REFUND: 'refunded',
      REVERSE: 'refunded',
      PREAUTH_APPROVED: 'processing',
    };

    return statusMap[statusUpper] || 'pending';
  }

  /**
   * Map payment status to event type
   */
  private mapEventType(status: string): string {
    if (!status) return 'payment.update';

    const statusUpper = status.toUpperCase();
    if (
      statusUpper === 'APPROVED' ||
      statusUpper === 'PAID' ||
      statusUpper === 'SETTLED'
    ) {
      return 'payment.completed';
    } else if (statusUpper === 'DECLINED') {
      return 'payment.failed';
    } else if (statusUpper === 'CANCELED' || statusUpper === 'CANCELLED') {
      return 'payment.cancelled';
    } else if (
      statusUpper === 'REFUNDED' ||
      statusUpper === 'PARTIAL_REFUND' ||
      statusUpper === 'REVERSE'
    ) {
      return 'payment.refunded';
    }

    return 'payment.update';
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   * Note: ABHI Pay may use different signature methods - adjust as needed
   */
  private verifyWebhookSignature(
    webhookData: any,
    signature: string,
    secret: string,
  ): boolean {
    try {
      // ABHI Pay signature verification method may vary
      // This is a generic implementation - adjust based on actual ABHI Pay signature method
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
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}
