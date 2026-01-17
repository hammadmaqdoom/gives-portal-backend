import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayCredentials } from '../../domain/payment-gateway-credentials';
import { PaymentTransaction } from '../../domain/payment-transaction';
import * as crypto from 'crypto';

interface PayFastTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayFastTransactionResponse {
  success: boolean;
  transaction_id: string;
  checkout_url?: string;
  message?: string;
  error?: string;
}

interface PayFastStatusResponse {
  success: boolean;
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  payment_method?: string;
  message?: string;
}

@Injectable()
export class PayFastService {
  private readonly logger = new Logger(PayFastService.name);
  private tokenCache: Map<string, { token: string; expiresAt: number }> =
    new Map();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get the base API URL based on environment
   * Reads from credentials additionalConfig, falls back to defaults
   */
  private getBaseUrl(credentials: PaymentGatewayCredentials): string {
    const config = credentials.additionalConfig || {};
    
    if (credentials.environment === 'production') {
      return (
        config.productionUrl ||
        config.production_url ||
        'https://api.gopayfast.com/api'
      );
    }
    
    return (
      config.sandboxUrl ||
      config.sandbox_url ||
      'https://sandbox.gopayfast.com/api'
    );
  }

  /**
   * Get access token using OAuth2 authentication
   * Caches tokens to avoid unnecessary API calls
   */
  async getAccessToken(credentials: PaymentGatewayCredentials): Promise<string> {
    const cacheKey = `${credentials.apiKey}_${credentials.environment}`;
    const cached = this.tokenCache.get(cacheKey);

      // Return cached token if still valid (with 5 minute buffer)
      if (cached && cached.expiresAt > Date.now() + 300000) {
        this.logger.log('Using cached PayFast access token');
        return cached.token;
      }

      this.logger.log('Fetching new PayFast access token');
    const baseUrl = this.getBaseUrl(credentials);

    try {
      const response = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: credentials.apiKey, // apiKey stores MERCHANT_ID
          secured_key: credentials.secretKey, // secretKey stores SECURED_KEY
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('PayFast token request failed:', errorText);
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data: PayFastTokenResponse = await response.json();

      // Cache the token
      this.tokenCache.set(cacheKey, {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      });

      this.logger.log('PayFast access token obtained successfully');
      return data.access_token;
    } catch (error) {
      this.logger.error('Error getting PayFast access token:', error);
      throw new Error(`PayFast authentication failed: ${error.message}`);
    }
  }

  /**
   * Create a payment session and return checkout URL
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
      this.logger.log('Creating PayFast payment session');
      this.logger.log('Transaction amount:', transaction.amount);
      this.logger.log('Currency:', transaction.currency);
      this.logger.log('Environment:', credentials.environment);

      // Get access token
      const accessToken = await this.getAccessToken(credentials);
      const baseUrl = this.getBaseUrl(credentials);

      // Get app URL for callbacks
      const appUrl =
        this.configService.get('APP_URL') ||
        this.configService.get('FRONTEND_DOMAIN') ||
        'http://localhost:3000';

      const redirectUrl = transaction.callbackUrl || `${appUrl}/payment/callback`;
      const cancelUrl = `${appUrl}/dashboard/fees`;
      const webhookUrl = `${appUrl}/api/v1/webhooks/payfast`;

      this.logger.log('Redirect URL:', redirectUrl);
      this.logger.log('Webhook URL:', webhookUrl);

      // Initiate transaction
      const response = await fetch(`${baseUrl}/transaction/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          merchant_order_id: transaction.transactionId,
          amount: transaction.amount,
          currency: transaction.currency,
          description: `Payment for Order ${transaction.transactionId}`,
          customer: customerInfo
            ? {
                first_name: customerInfo.firstName || 'Customer',
                last_name: customerInfo.lastName || '',
                email: customerInfo.email || '',
                phone: customerInfo.phone || '',
              }
            : undefined,
          return_url: redirectUrl,
          cancel_url: cancelUrl,
          notification_url: webhookUrl,
          metadata: {
            transaction_id: transaction.transactionId,
            invoice_id: transaction.invoiceId,
            student_id: transaction.studentId,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('PayFast transaction initiation failed:', errorText);
        throw new Error(`Transaction initiation failed: ${response.statusText}`);
      }

      const data: PayFastTransactionResponse = await response.json();

      if (!data.success || !data.checkout_url) {
        this.logger.error('PayFast returned error:', data.error || data.message);
        throw new Error(
          data.error || data.message || 'Failed to create payment session',
        );
      }

      this.logger.log('PayFast payment session created successfully');
      this.logger.log('Transaction ID:', data.transaction_id);
      this.logger.log('Checkout URL:', data.checkout_url);

      return {
        checkoutUrl: data.checkout_url,
        sessionToken: data.transaction_id,
        authToken: data.transaction_id,
      };
    } catch (error) {
      this.logger.error('PayFast payment session creation failed:', error);
      throw new Error(
        `PayFast payment session creation failed: ${error.message}`,
      );
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(
    transactionId: string,
    credentials: PaymentGatewayCredentials,
  ): Promise<boolean> {
    try {
      this.logger.log('Verifying PayFast payment:', transactionId);

      const accessToken = await this.getAccessToken(credentials);
      const baseUrl = this.getBaseUrl(credentials);

      const response = await fetch(
        `${baseUrl}/transaction/status/${transactionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        this.logger.error('PayFast status check failed:', response.statusText);
        return false;
      }

      const data: PayFastStatusResponse = await response.json();

      this.logger.log('PayFast payment status:', data.status);

      // Check if payment is completed/successful
      const isCompleted =
        data.status === 'COMPLETED' ||
        data.status === 'SUCCESS' ||
        data.status === 'PAID';

      return isCompleted;
    } catch (error) {
      this.logger.error('PayFast payment verification failed:', error);
      return false;
    }
  }

  /**
   * Get detailed payment information
   */
  async getPaymentDetails(
    transactionId: string,
    credentials: PaymentGatewayCredentials,
  ): Promise<{
    success: boolean;
    status: string;
    message: string;
    transactionData?: any;
  }> {
    try {
      this.logger.log('Getting PayFast payment details:', transactionId);

      const accessToken = await this.getAccessToken(credentials);
      const baseUrl = this.getBaseUrl(credentials);

      const response = await fetch(
        `${baseUrl}/transaction/status/${transactionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          message: `Failed to get payment details: ${response.statusText}`,
        };
      }

      const data: PayFastStatusResponse = await response.json();

      const isCompleted =
        data.status === 'COMPLETED' ||
        data.status === 'SUCCESS' ||
        data.status === 'PAID';

      return {
        success: isCompleted,
        status: isCompleted ? 'completed' : data.status.toLowerCase(),
        message: isCompleted
          ? 'Payment verified successfully'
          : `Payment status: ${data.status}`,
        transactionData: data,
      };
    } catch (error) {
      this.logger.error('PayFast payment details fetch failed:', error);
      return {
        success: false,
        status: 'failed',
        message: `Payment details fetch failed: ${error.message}`,
      };
    }
  }

  /**
   * Test connection to PayFast API
   */
  async testConnection(credentials: PaymentGatewayCredentials): Promise<boolean> {
    try {
      this.logger.log('Testing PayFast connection');

      // Try to get access token as a connection test
      await this.getAccessToken(credentials);

      this.logger.log('PayFast connection test successful');
      return true;
    } catch (error) {
      this.logger.error('PayFast connection test failed:', error);
      return false;
    }
  }

  /**
   * Process webhook notification
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
      this.logger.log('Processing PayFast webhook');
      this.logger.log('Webhook data:', JSON.stringify(webhookData, null, 2));

      // Verify webhook signature if webhook secret is configured
      if (credentials.webhookSecret && signature) {
        const isValid = this.verifyWebhookSignature(
          webhookData,
          signature,
          credentials.webhookSecret,
        );

        if (!isValid) {
          this.logger.warn('Invalid PayFast webhook signature');
          throw new Error('Invalid webhook signature');
        }

        this.logger.log('PayFast webhook signature verified');
      } else {
        this.logger.warn(
          'PayFast webhook secret not configured, skipping signature verification',
        );
      }

      // Extract data from webhook payload
      const eventType = webhookData.event_type || webhookData.type || 'payment.update';
      const transactionId =
        webhookData.transaction_id ||
        webhookData.merchant_order_id ||
        webhookData.order_id;
      const status = this.mapWebhookStatus(
        webhookData.status || webhookData.payment_status,
      );
      const amount = webhookData.amount || 0;
      const currency = webhookData.currency || 'PKR';

      this.logger.log('Webhook event type:', eventType);
      this.logger.log('Transaction ID:', transactionId);
      this.logger.log('Status:', status);

      return {
        eventType,
        transactionId,
        status,
        amount,
        currency,
      };
    } catch (error) {
      this.logger.error('PayFast webhook processing failed:', error);
      throw new Error(`PayFast webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  private verifyWebhookSignature(
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
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Map PayFast webhook status to internal status
   */
  private mapWebhookStatus(status: string): string {
    const statusMap: Record<string, string> = {
      COMPLETED: 'completed',
      SUCCESS: 'completed',
      PAID: 'completed',
      FAILED: 'failed',
      FAILURE: 'failed',
      CANCELLED: 'cancelled',
      CANCELED: 'cancelled',
      PENDING: 'pending',
      PROCESSING: 'processing',
      REFUNDED: 'refunded',
      REVERSED: 'refunded',
    };

    return statusMap[status?.toUpperCase()] || 'pending';
  }
}
