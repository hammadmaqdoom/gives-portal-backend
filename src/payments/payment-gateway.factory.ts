import { Injectable } from '@nestjs/common';
import { PaymentGateway } from './domain/payment-gateway';
import { PaymentGatewayCredentials } from './domain/payment-gateway-credentials';
import { SafepayService } from './gateways/safepay/safepay.service';
import { PayFastService } from './gateways/payfast/payfast.service';
import { AbhiPayService } from './gateways/abhipay/abhipay.service';
import { StripeService } from './gateways/stripe/stripe.service';

export interface PaymentGatewayInterface {
  createPaymentSession(
    credentials: PaymentGatewayCredentials,
    transaction: any,
    customerInfo?: any,
  ): Promise<{
    sessionToken: string;
    authToken: string;
    checkoutUrl: string;
  }>;

  verifyPayment(
    credentials: PaymentGatewayCredentials,
    trackerToken: string,
  ): Promise<{
    status: string;
    transactionId: string;
    amount: number;
    currency: string;
    paymentMethod?: any;
  }>;

  processWebhook(
    credentials: PaymentGatewayCredentials,
    webhookData: any,
    signature: string,
  ): Promise<{
    eventType: string;
    transactionId: string;
    status: string;
    amount: number;
    currency: string;
  }>;
}

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private safepayService: SafepayService,
    private payFastService: PayFastService,
    private abhiPayService: AbhiPayService,
    private stripeService: StripeService,
  ) {}

  getGateway(gateway: PaymentGateway): PaymentGatewayInterface {
    switch (gateway.name) {
      case 'safepay':
        return {
          createPaymentSession: async (
            credentials,
            transaction,
            customerInfo,
          ) => {
            const result = await this.safepayService.createPaymentSession(
              transaction,
              credentials,
              customerInfo,
            );
            return {
              sessionToken: result.sessionToken,
              authToken: result.authToken,
              checkoutUrl: result.checkoutUrl,
            };
          },
          verifyPayment: async (credentials, trackerToken) => {
            const isCompleted = await this.safepayService.verifyPayment(
              trackerToken,
              credentials,
            );
            return {
              status: isCompleted ? 'completed' : 'failed',
              transactionId: trackerToken,
              amount: 0,
              currency: 'PKR', // Default currency for this application
            };
          },
          processWebhook: async (credentials, webhookData, signature) => {
            const result = await this.safepayService.processWebhook(
              credentials,
              webhookData,
              signature,
            );
            return {
              eventType: 'payment.completed',
              transactionId: result.transactionId,
              status: result.status,
              amount: result.amount,
              currency: result.currency,
            };
          },
        };

      case 'payfast':
        return {
          createPaymentSession: async (
            credentials,
            transaction,
            customerInfo,
          ) => {
            const result = await this.payFastService.createPaymentSession(
              transaction,
              credentials,
              customerInfo,
            );
            return {
              sessionToken: result.sessionToken,
              authToken: result.authToken,
              checkoutUrl: result.checkoutUrl,
            };
          },
          verifyPayment: async (credentials, trackerToken) => {
            const isCompleted = await this.payFastService.verifyPayment(
              trackerToken,
              credentials,
            );
            return {
              status: isCompleted ? 'completed' : 'failed',
              transactionId: trackerToken,
              amount: 0,
              currency: 'PKR',
            };
          },
          processWebhook: async (credentials, webhookData, signature) => {
            const result = await this.payFastService.processWebhook(
              credentials,
              webhookData,
              signature,
            );
            return {
              eventType: result.eventType,
              transactionId: result.transactionId,
              status: result.status,
              amount: result.amount,
              currency: result.currency,
            };
          },
        };

      case 'abhipay':
        return {
          createPaymentSession: async (
            credentials,
            transaction,
            customerInfo,
          ) => {
            const result = await this.abhiPayService.createPaymentSession(
              transaction,
              credentials,
              customerInfo,
            );
            return {
              sessionToken: result.sessionToken,
              authToken: result.authToken,
              checkoutUrl: result.checkoutUrl,
            };
          },
          verifyPayment: async (credentials, trackerToken) => {
            const isCompleted = await this.abhiPayService.verifyPayment(
              trackerToken,
              credentials,
            );
            return {
              status: isCompleted ? 'completed' : 'failed',
              transactionId: trackerToken,
              amount: 0,
              currency: 'PKR',
            };
          },
          processWebhook: async (credentials, webhookData, signature) => {
            const result = await this.abhiPayService.processWebhook(
              credentials,
              webhookData,
              signature,
            );
            return {
              eventType: result.eventType,
              transactionId: result.transactionId,
              status: result.status,
              amount: result.amount,
              currency: result.currency,
            };
          },
        };

      case 'stripe':
        return {
          createPaymentSession: async (
            credentials,
            transaction,
            customerInfo,
          ) => {
            const result = await this.stripeService.createPaymentSession(
              transaction,
              credentials,
              customerInfo,
            );
            return {
              sessionToken: result.sessionToken,
              authToken: result.authToken,
              checkoutUrl: result.checkoutUrl,
            };
          },
          verifyPayment: async (credentials, trackerToken) => {
            const paymentDetails = await this.stripeService.getPaymentDetails(
              trackerToken,
              credentials,
            );
            return {
              status: paymentDetails.status,
              transactionId: trackerToken,
              amount: paymentDetails.paymentData?.amount
                ? paymentDetails.paymentData.amount / 100
                : 0,
              currency: paymentDetails.paymentData?.currency?.toUpperCase() || 'USD',
            };
          },
          processWebhook: async (credentials, webhookData, signature) => {
            const result = await this.stripeService.processWebhook(
              credentials,
              webhookData,
              signature,
            );
            return {
              eventType: result.eventType,
              transactionId: result.transactionId,
              status: result.status,
              amount: result.amount,
              currency: result.currency,
            };
          },
        };

      // Add more gateways here as they are implemented
      // case 'paypal':
      //   return this.paypalService;

      default:
        throw new Error(`Payment gateway '${gateway.name}' is not supported`);
    }
  }

  getSupportedGateways(): string[] {
    return ['safepay', 'payfast', 'abhipay', 'stripe', 'bank_transfer'];
  }
}
