import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentGatewayCredentials } from '../../domain/payment-gateway-credentials';
import { PaymentTransaction } from '../../domain/payment-transaction';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Stripe client with credentials
   */
  private getStripeClient(credentials: PaymentGatewayCredentials): Stripe {
    // For Stripe, apiKey stores the publishable key, secretKey stores the secret key
    // Environment determines if we use test or live mode
    const secretKey = credentials.secretKey;

    if (!secretKey) {
      throw new Error('Stripe secret key is required');
    }

    return new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover', // Use latest stable API version
    });
  }

  /**
   * Create a payment session using Stripe Checkout
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
      this.logger.log('Creating Stripe payment session');
      this.logger.log('Transaction amount:', transaction.amount);
      this.logger.log('Currency:', transaction.currency);
      this.logger.log('Environment:', credentials.environment);

      const stripe = this.getStripeClient(credentials);

      // Get app URL for callbacks
      const appUrl =
        this.configService.get('APP_URL') ||
        this.configService.get('FRONTEND_DOMAIN') ||
        'http://localhost:3000';

      const successUrl = transaction.callbackUrl || `${appUrl}/payment/callback?success=true`;
      const cancelUrl = transaction.callbackUrl || `${appUrl}/payment/callback?canceled=true`;
      const webhookUrl = `${appUrl}/api/v1/webhooks/stripe`;

      this.logger.log('Success URL:', successUrl);
      this.logger.log('Cancel URL:', cancelUrl);
      this.logger.log('Webhook URL:', webhookUrl);

      // Convert amount to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(transaction.amount * 100);

      // Create customer metadata
      const customerMetadata: Record<string, string> = {
        transaction_id: transaction.transactionId,
      };

      if (transaction.invoiceId) {
        customerMetadata.invoice_id = transaction.invoiceId.toString();
      }
      if (transaction.studentId) {
        customerMetadata.student_id = transaction.studentId.toString();
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: transaction.currency.toLowerCase(),
              product_data: {
                name: `Payment for Order ${transaction.transactionId}`,
                description: transaction.transactionId,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerInfo?.email,
        metadata: customerMetadata,
        payment_intent_data: {
          metadata: customerMetadata,
        },
      });

      this.logger.log('Stripe checkout session created successfully');
      this.logger.log('Session ID:', session.id);
      this.logger.log('Checkout URL:', session.url);

      if (!session.url) {
        throw new Error('Stripe checkout session URL is missing');
      }

      return {
        checkoutUrl: session.url,
        sessionToken: session.id,
        authToken: session.id, // Using session ID as auth token
      };
    } catch (error) {
      this.logger.error('Stripe payment session creation failed:', error);
      throw new Error(
        `Stripe payment session creation failed: ${error.message}`,
      );
    }
  }

  /**
   * Verify payment status using payment intent ID or session ID
   */
  async verifyPayment(
    identifier: string,
    credentials: PaymentGatewayCredentials,
  ): Promise<boolean> {
    try {
      this.logger.log('Verifying Stripe payment:', identifier);

      const stripe = this.getStripeClient(credentials);

      // Try to retrieve as payment intent first
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(identifier);
        this.logger.log('Stripe payment intent status:', paymentIntent.status);
        return paymentIntent.status === 'succeeded';
      } catch (error) {
        // If not a payment intent, try as checkout session
        this.logger.log('Not a payment intent, trying as checkout session');
        try {
          const session = await stripe.checkout.sessions.retrieve(identifier);
          this.logger.log('Stripe checkout session status:', session.payment_status);
          
          // If session has a payment intent, verify that
          if (session.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              session.payment_intent as string,
            );
            return paymentIntent.status === 'succeeded';
          }
          
          return session.payment_status === 'paid';
        } catch (sessionError) {
          this.logger.error('Failed to retrieve as session:', sessionError);
          throw error; // Throw original error
        }
      }
    } catch (error) {
      this.logger.error('Stripe payment verification failed:', error);
      return false;
    }
  }

  /**
   * Get detailed payment information using payment intent ID or session ID
   */
  async getPaymentDetails(
    identifier: string,
    credentials: PaymentGatewayCredentials,
  ): Promise<{
    success: boolean;
    status: string;
    message: string;
    paymentData?: any;
  }> {
    try {
      this.logger.log('Getting Stripe payment details:', identifier);

      const stripe = this.getStripeClient(credentials);

      // Try to retrieve as payment intent first
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(identifier);
        const isCompleted = paymentIntent.status === 'succeeded';

        return {
          success: isCompleted,
          status: this.mapStripeStatus(paymentIntent.status),
          message: isCompleted
            ? 'Payment verified successfully'
            : `Payment status: ${paymentIntent.status}`,
          paymentData: paymentIntent,
        };
      } catch (error) {
        // If not a payment intent, try as checkout session
        this.logger.log('Not a payment intent, trying as checkout session');
        try {
          const session = await stripe.checkout.sessions.retrieve(identifier);
          
          // If session has a payment intent, retrieve that for details
          if (session.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              session.payment_intent as string,
            );
            const isCompleted = paymentIntent.status === 'succeeded';

            return {
              success: isCompleted,
              status: this.mapStripeStatus(paymentIntent.status),
              message: isCompleted
                ? 'Payment verified successfully'
                : `Payment status: ${paymentIntent.status}`,
              paymentData: paymentIntent,
            };
          }

          const isPaid = session.payment_status === 'paid';
          return {
            success: isPaid,
            status: isPaid ? 'completed' : 'pending',
            message: isPaid
              ? 'Payment verified successfully'
              : `Payment status: ${session.payment_status}`,
            paymentData: session,
          };
        } catch (sessionError) {
          this.logger.error('Failed to retrieve as session:', sessionError);
          throw error; // Throw original error
        }
      }
    } catch (error) {
      this.logger.error('Stripe payment details fetch failed:', error);
      return {
        success: false,
        status: 'failed',
        message: `Payment details fetch failed: ${error.message}`,
      };
    }
  }

  /**
   * Test connection to Stripe API
   */
  async testConnection(credentials: PaymentGatewayCredentials): Promise<boolean> {
    try {
      this.logger.log('Testing Stripe connection');

      const stripe = this.getStripeClient(credentials);

      // Test connection by retrieving account information
      await stripe.accounts.retrieve('me');

      this.logger.log('Stripe connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Stripe connection test failed:', error);
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
      this.logger.log('Processing Stripe webhook');
      this.logger.log('Webhook event type:', webhookData.type);

      // Verify webhook signature if webhook secret is configured
      if (credentials.webhookSecret && signature) {
        const stripe = this.getStripeClient(credentials);
        
        try {
          // Note: Stripe webhook signature verification requires the raw request body.
          // Since NestJS parses the body by default, we reconstruct it from the parsed object.
          // For production, consider using raw body middleware for webhook endpoints.
          // The signature verification may fail if JSON key ordering differs.
          const rawBody = JSON.stringify(webhookData);
          
          // Construct and verify the event
          const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            credentials.webhookSecret,
          );

          this.logger.log('Stripe webhook signature verified');
          this.logger.log('Event type:', event.type);

          // Extract data based on event type
          let transactionId: string;
          let status: string;
          let amount: number = 0;
          let currency: string = 'USD';

          switch (event.type) {
            case 'checkout.session.completed':
              const session = event.data.object as Stripe.Checkout.Session;
              transactionId = session.metadata?.transaction_id || session.id;
              status = session.payment_status === 'paid' ? 'completed' : 'pending';
              amount = (session.amount_total || 0) / 100; // Convert from cents
              currency = (session.currency || 'usd').toUpperCase();
              break;

            case 'payment_intent.succeeded':
              const paymentIntent = event.data.object as Stripe.PaymentIntent;
              transactionId = paymentIntent.metadata?.transaction_id || paymentIntent.id;
              status = 'completed';
              amount = paymentIntent.amount / 100; // Convert from cents
              currency = paymentIntent.currency.toUpperCase();
              break;

            case 'payment_intent.payment_failed':
              const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
              transactionId = failedPaymentIntent.metadata?.transaction_id || failedPaymentIntent.id;
              status = 'failed';
              amount = failedPaymentIntent.amount / 100;
              currency = failedPaymentIntent.currency.toUpperCase();
              break;

            case 'payment_intent.canceled':
              const canceledPaymentIntent = event.data.object as Stripe.PaymentIntent;
              transactionId = canceledPaymentIntent.metadata?.transaction_id || canceledPaymentIntent.id;
              status = 'cancelled';
              amount = canceledPaymentIntent.amount / 100;
              currency = canceledPaymentIntent.currency.toUpperCase();
              break;

            case 'charge.refunded':
              const charge = event.data.object as Stripe.Charge;
              transactionId = charge.metadata?.transaction_id || charge.payment_intent as string || charge.id;
              status = 'refunded';
              amount = (charge.amount_refunded || 0) / 100;
              currency = charge.currency.toUpperCase();
              break;

            default:
              this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
              transactionId = event.id;
              status = 'pending';
          }

          this.logger.log('Extracted transaction ID:', transactionId);
          this.logger.log('Extracted status:', status);
          this.logger.log('Extracted amount:', amount);
          this.logger.log('Extracted currency:', currency);

          return {
            eventType: event.type,
            transactionId,
            status,
            amount,
            currency,
          };
        } catch (error) {
          this.logger.error('Error verifying Stripe webhook signature:', error);
          throw new Error(`Webhook signature verification failed: ${error.message}`);
        }
      } else {
        this.logger.warn(
          'No webhook secret provided, skipping signature verification',
        );
        
        // Fallback: try to extract data without verification (not recommended for production)
        const eventType = webhookData.type || 'unknown';
        const transactionId = webhookData.data?.object?.metadata?.transaction_id || 
                             webhookData.data?.object?.id || 
                             webhookData.id;
        const status = this.mapStripeStatus(webhookData.data?.object?.status || 'pending');
        const amount = (webhookData.data?.object?.amount || 0) / 100;
        const currency = (webhookData.data?.object?.currency || 'usd').toUpperCase();

        return {
          eventType,
          transactionId,
          status,
          amount,
          currency,
        };
      }
    } catch (error) {
      this.logger.error('Stripe webhook processing failed:', error);
      throw new Error(`Stripe webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Map Stripe status to internal status
   */
  private mapStripeStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      succeeded: 'completed',
      processing: 'processing',
      requires_payment_method: 'failed',
      requires_confirmation: 'processing',
      requires_action: 'processing',
      canceled: 'cancelled',
      refunded: 'refunded',
      partially_refunded: 'refunded',
    };

    return statusMap[stripeStatus?.toLowerCase()] || 'pending';
  }
}
