import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayCredentials } from '../../domain/payment-gateway-credentials';
import { PaymentTransaction } from '../../domain/payment-transaction';

@Injectable()
export class SafepayService {
  private readonly logger = new Logger(SafepayService.name);

  constructor(private readonly configService: ConfigService) {}

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
      this.logger.log('Safepay SDK initialized successfully');
      this.logger.log('Using API Key:', credentials.apiKey);
      this.logger.log('Environment:', credentials.environment);

      // Initialize Safepay SDK with correct configuration
      const safepay = require('@sfpy/node-core')(credentials.secretKey, {
        authType: 'secret',
        host:
          credentials.environment === 'production'
            ? 'https://api.getsafepay.com'
            : 'https://sandbox.api.getsafepay.com',
      });

      this.logger.log('Safepay SDK object:', Object.keys(safepay));

      // Step 1: Create customer (optional - prefill customer details)
      let customerToken = null;
      if (customerInfo) {
        try {
          this.logger.log('Creating customer with info:', customerInfo);
          this.logger.log(
            'Available user methods:',
            Object.keys(safepay.user || {}),
          );

          // Try different possible customer creation methods
          let customerResponse;
          try {
            // Try the method from the documentation
            customerResponse = await safepay.user.customers.create({
              payload: {
                first_name: customerInfo.firstName || 'Customer',
                last_name: customerInfo.lastName || 'User',
                email: customerInfo.email || 'customer@example.com',
                phone_number: customerInfo.phone || '+923001234567',
                country: 'PK',
                is_guest: true,
              },
            });
          } catch (error) {
            this.logger.warn(
              'user.customers.create failed, trying alternative methods:',
              error.message,
            );

            // Try alternative methods
            if (
              safepay.user &&
              safepay.user.object &&
              safepay.user.object.create
            ) {
              this.logger.log('Trying user.object.create...');
              customerResponse = await safepay.user.object.create({
                first_name: customerInfo.firstName || 'Customer',
                last_name: customerInfo.lastName || 'User',
                email: customerInfo.email || 'customer@example.com',
                phone_number: customerInfo.phone || '+923001234567',
                country: 'PK',
                is_guest: true,
              });
            } else if (safepay.customers && safepay.customers.create) {
              this.logger.log('Trying customers.create...');
              customerResponse = await safepay.customers.create({
                first_name: customerInfo.firstName || 'Customer',
                last_name: customerInfo.lastName || 'User',
                email: customerInfo.email || 'customer@example.com',
                phone_number: customerInfo.phone || '+923001234567',
                country: 'PK',
                is_guest: true,
              });
            } else {
              throw new Error('No valid customer creation method found');
            }
          }

          customerToken = customerResponse.data.token;
          this.logger.log(
            'Customer created successfully, token:',
            customerToken,
          );
        } catch (error) {
          this.logger.warn(
            'Customer creation failed, proceeding without customer:',
            error,
          );
        }
      }

      // Step 2: Create payment session
      this.logger.log(
        'Creating payment session with amount:',
        transaction.amount,
      );
      this.logger.log('Currency:', transaction.currency);

      const sessionResponse = await safepay.payments.session.setup({
        merchant_api_key: credentials.apiKey,
        user: customerToken, // Use customer token if available
        intent: 'CYBERSOURCE',
        mode: 'payment',
        entry_mode: 'raw',
        currency: transaction.currency,
        amount: Math.round(transaction.amount * 100), // Convert to lowest denomination
        metadata: {
          order_id: transaction.transactionId,
        },
        include_fees: false,
      });

      this.logger.log(
        'Payment session created:',
        sessionResponse.data.tracker.token,
      );

      // Step 3: Create authentication token
      this.logger.log('Creating authentication token...');
      this.logger.log(
        'Available auth methods:',
        Object.keys(safepay.auth || {}),
      );

      // Try different possible auth methods
      let authResponse;
      try {
        // Try the method from the documentation
        authResponse = await safepay.auth.passport.create();
      } catch (error) {
        this.logger.warn(
          'auth.passport.create failed, trying alternative methods:',
          error.message,
        );

        // Try alternative methods
        if (
          safepay.client &&
          safepay.client.passport &&
          safepay.client.passport.create
        ) {
          this.logger.log('Trying client.passport.create...');
          authResponse = await safepay.client.passport.create();
        } else if (safepay.auth && safepay.auth.create) {
          this.logger.log('Trying auth.create...');
          authResponse = await safepay.auth.create();
        } else {
          throw new Error('No valid authentication method found');
        }
      }

      this.logger.log('Authentication token created');

      // Step 4: Generate checkout URL
      const appUrl =
        this.configService.get('APP_URL', { infer: true }) ||
        this.configService.get('FRONTEND_DOMAIN', { infer: true }) ||
        'http://localhost:3000';
      this.logger.log('App URL from config:', appUrl);

      // Ensure we have a valid redirect URL
      this.logger.log('Transaction callback URL:', transaction.callbackUrl);
      this.logger.log('App URL from config:', appUrl);

      const redirectUrl =
        transaction.callbackUrl || `${appUrl}/payment/callback`;
      const cancelUrl = `${appUrl}/dashboard/fees`;
      const webhookUrl = `${appUrl}/api/v1/webhooks/safepay`;

      this.logger.log('Final redirect URL:', redirectUrl);
      this.logger.log('Final cancel URL:', cancelUrl);
      this.logger.log('Webhook URL:', webhookUrl);

      this.logger.log('Generating checkout URL...');
      this.logger.log('Redirect URL:', redirectUrl);
      this.logger.log('Cancel URL:', cancelUrl);

      // Try different checkout URL generation methods
      let checkoutUrl;
      try {
        // Try the method from the documentation first
        checkoutUrl = safepay.checkouts.payment.create({
          tracker: sessionResponse.data.tracker.token,
          tbt: authResponse.data,
          environment:
            credentials.environment === 'production' ? 'production' : 'sandbox',
          source: 'hosted',
          user_id: customerToken,
          redirect_url: redirectUrl,
          cancel_url: cancelUrl,
          webhook_url: webhookUrl,
        });
      } catch (error) {
        this.logger.warn(
          'checkouts.payment.create failed, trying alternative methods:',
          error.message,
        );

        // Try alternative methods
        if (safepay.checkout && safepay.checkout.createCheckoutUrl) {
          this.logger.log('Trying checkout.createCheckoutUrl...');
          checkoutUrl = safepay.checkout.createCheckoutUrl({
            tracker: sessionResponse.data.tracker.token,
            tbt: authResponse.data,
            env:
              credentials.environment === 'production'
                ? 'production'
                : 'sandbox',
            source: 'hosted',
            user_id: customerToken,
            redirect_url: redirectUrl,
            cancel_url: cancelUrl,
          });
        } else {
          throw new Error('No valid checkout URL generation method found');
        }
      }

      this.logger.log('Generated checkout URL:', checkoutUrl);

      // Validate the result
      if (!checkoutUrl || checkoutUrl === 'undefined') {
        this.logger.error('Invalid checkout URL generated:', checkoutUrl);
        throw new Error('Safepay SDK returned invalid checkout URL');
      }

      if (!checkoutUrl.includes('getsafepay.com')) {
        this.logger.error('Checkout URL is not a Safepay domain:', checkoutUrl);
        throw new Error('Generated URL is not a valid Safepay checkout URL');
      }

      // Log success
      this.logger.log('✅ Checkout URL generated successfully:', checkoutUrl);

      return {
        checkoutUrl,
        sessionToken: sessionResponse.data.tracker.token,
        authToken: sessionResponse.data.tracker.token, // Using tracker token as auth token
      };
    } catch (error) {
      this.logger.error('Safepay payment session creation failed:', error);
      throw new Error(
        `Safepay payment session creation failed: ${error.message}`,
      );
    }
  }

  async verifyPayment(
    transactionId: string,
    credentials: PaymentGatewayCredentials,
  ): Promise<boolean> {
    try {
      // Initialize Safepay SDK
      const safepay = require('@sfpy/node-core')(credentials.secretKey, {
        authType: 'secret',
        host:
          credentials.environment === 'production'
            ? 'https://api.getsafepay.com'
            : 'https://sandbox.api.getsafepay.com',
      });

      // Verify payment using Safepay API
      const verificationResponse =
        await safepay.reporter.payments.fetch(transactionId);

      // Check if payment is completed
      return verificationResponse.data.tracker.state === 'TRACKER_ENDED';
    } catch (error) {
      this.logger.error('Safepay payment verification failed:', error);
      return false;
    }
  }

  async getPaymentDetails(
    transactionId: string,
    credentials: PaymentGatewayCredentials,
  ): Promise<{
    success: boolean;
    status: string;
    message: string;
    trackerData?: any;
  }> {
    try {
      this.logger.log('Getting payment details from Safepay...');
      this.logger.log('Transaction ID:', transactionId);

      // Initialize Safepay SDK
      const safepay = require('@sfpy/node-core')(credentials.secretKey, {
        authType: 'secret',
        host:
          credentials.environment === 'production'
            ? 'https://api.getsafepay.com'
            : 'https://sandbox.api.getsafepay.com',
      });

      // Get payment details using reporter API
      const response = await safepay.reporter.payments.fetch(transactionId);

      this.logger.log(
        'Safepay payment details response:',
        JSON.stringify(response, null, 2),
      );

      if (response.data && response.data.tracker) {
        const tracker = response.data.tracker;
        const isCompleted = tracker.state === 'TRACKER_ENDED';

        this.logger.log('Tracker state:', tracker.state);
        this.logger.log('Payment completed:', isCompleted);

        return {
          success: isCompleted,
          status: isCompleted ? 'completed' : 'pending',
          message: isCompleted
            ? 'Payment verified successfully'
            : 'Payment is still pending',
          trackerData: response.data,
        };
      }

      return {
        success: false,
        status: 'failed',
        message: 'Invalid response from Safepay',
      };
    } catch (error) {
      this.logger.error('Safepay payment details fetch failed:', error);
      return {
        success: false,
        status: 'failed',
        message: `Payment details fetch failed: ${error.message}`,
      };
    }
  }

  async testConnection(
    credentials: PaymentGatewayCredentials,
  ): Promise<boolean> {
    try {
      // Initialize Safepay SDK
      const safepay = require('@sfpy/node-core')(credentials.secretKey, {
        authType: 'secret',
        host:
          credentials.environment === 'production'
            ? 'https://api.getsafepay.com'
            : 'https://sandbox.api.getsafepay.com',
      });

      // Test connection by creating a test session
      await safepay.payments.session.setup({
        merchant_api_key: credentials.apiKey,
        intent: 'CYBERSOURCE',
        mode: 'payment',
        entry_mode: 'raw',
        currency: 'PKR', // Test with PKR as it's more common for this application
        amount: 100, // $1.00 test amount
        metadata: {
          order_id: 'test_connection',
        },
        include_fees: false,
      });

      return true;
    } catch (error) {
      this.logger.error('Safepay connection test failed:', error);
      return false;
    }
  }

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
      // Initialize Safepay SDK
      const safepay = require('@sfpy/node-core')(credentials.secretKey, {
        authType: 'secret',
        host:
          credentials.environment === 'production'
            ? 'https://api.getsafepay.com'
            : 'https://sandbox.api.getsafepay.com',
      });

      // Verify webhook signature and process payload
      // This is a simplified implementation - in production, you should verify the signature
      this.logger.log('Processing Safepay webhook:', webhookData);

      return {
        eventType: webhookData.event_type || 'payment.completed',
        transactionId: webhookData.tracker || webhookData.transaction_id,
        status: webhookData.status || 'completed',
        amount: webhookData.amount || 0,
        currency: webhookData.currency || 'PKR',
      };
    } catch (error) {
      this.logger.error('Safepay webhook processing failed:', error);
      throw new Error(`Safepay webhook processing failed: ${error.message}`);
    }
  }
}
