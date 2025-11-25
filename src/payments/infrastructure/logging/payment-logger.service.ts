import { Injectable, Logger } from '@nestjs/common';
import { PaymentTransaction } from '../../domain/payment-transaction';
import { PaymentGateway } from '../../domain/payment-gateway';

@Injectable()
export class PaymentLoggerService {
  private readonly logger = new Logger(PaymentLoggerService.name);

  // Transaction logging
  logTransactionCreated(transaction: PaymentTransaction): void {
    this.logger.log({
      message: 'Payment transaction created',
      transactionId: transaction.transactionId,
      gatewayId: transaction.gatewayId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      studentId: transaction.studentId,
      invoiceId: transaction.invoiceId,
    });
  }

  logTransactionUpdated(
    transaction: PaymentTransaction,
    oldStatus: string,
  ): void {
    this.logger.log({
      message: 'Payment transaction updated',
      transactionId: transaction.transactionId,
      oldStatus,
      newStatus: transaction.status,
      gatewayId: transaction.gatewayId,
      amount: transaction.amount,
      processedAt: transaction.processedAt,
    });
  }

  logTransactionCompleted(transaction: PaymentTransaction): void {
    this.logger.log({
      message: 'Payment transaction completed successfully',
      transactionId: transaction.transactionId,
      gatewayId: transaction.gatewayId,
      amount: transaction.amount,
      currency: transaction.currency,
      studentId: transaction.studentId,
      invoiceId: transaction.invoiceId,
      processedAt: transaction.processedAt,
    });
  }

  logTransactionFailed(transaction: PaymentTransaction, reason: string): void {
    this.logger.warn({
      message: 'Payment transaction failed',
      transactionId: transaction.transactionId,
      gatewayId: transaction.gatewayId,
      amount: transaction.amount,
      currency: transaction.currency,
      studentId: transaction.studentId,
      invoiceId: transaction.invoiceId,
      failureReason: reason,
    });
  }

  // Gateway logging
  logGatewayConnectionTest(
    gateway: PaymentGateway,
    success: boolean,
    message: string,
  ): void {
    if (success) {
      this.logger.log({
        message: 'Payment gateway connection test successful',
        gatewayId: gateway.id,
        gatewayName: gateway.name,
        testMessage: message,
      });
    } else {
      this.logger.warn({
        message: 'Payment gateway connection test failed',
        gatewayId: gateway.id,
        gatewayName: gateway.name,
        errorMessage: message,
      });
    }
  }

  logGatewayCredentialsUpdated(gatewayId: number, environment: string): void {
    this.logger.log({
      message: 'Payment gateway credentials updated',
      gatewayId,
      environment,
    });
  }

  logGatewayStatusChanged(gateway: PaymentGateway, oldStatus: boolean): void {
    this.logger.log({
      message: 'Payment gateway status changed',
      gatewayId: gateway.id,
      gatewayName: gateway.name,
      oldStatus,
      newStatus: gateway.isActive,
    });
  }

  // Webhook logging
  logWebhookReceived(
    gatewayName: string,
    transactionId: string,
    status: string,
  ): void {
    this.logger.log({
      message: 'Payment webhook received',
      gatewayName,
      transactionId,
      status,
    });
  }

  logWebhookProcessed(
    gatewayName: string,
    transactionId: string,
    success: boolean,
    message: string,
  ): void {
    if (success) {
      this.logger.log({
        message: 'Payment webhook processed successfully',
        gatewayName,
        transactionId,
        result: message,
      });
    } else {
      this.logger.error({
        message: 'Payment webhook processing failed',
        gatewayName,
        transactionId,
        errorMessage: message,
      });
    }
  }

  logWebhookSignatureVerification(gatewayName: string, valid: boolean): void {
    if (valid) {
      this.logger.log({
        message: 'Webhook signature verification successful',
        gatewayName,
      });
    } else {
      this.logger.warn({
        message: 'Webhook signature verification failed',
        gatewayName,
      });
    }
  }

  // Error logging
  logPaymentError(error: Error, context: any): void {
    this.logger.error({
      message: 'Payment processing error',
      error: error.message,
      stack: error.stack,
      context,
    });
  }

  logGatewayError(gatewayName: string, error: Error, context: any): void {
    this.logger.error({
      message: 'Payment gateway error',
      gatewayName,
      error: error.message,
      stack: error.stack,
      context,
    });
  }

  logEncryptionError(operation: string, error: Error): void {
    this.logger.error({
      message: 'Payment data encryption error',
      operation,
      error: error.message,
      stack: error.stack,
    });
  }

  // Security logging
  logSecurityEvent(event: string, details: any): void {
    this.logger.warn({
      message: 'Payment security event',
      event,
      details,
    });
  }

  logSuspiciousActivity(activity: string, details: any): void {
    this.logger.error({
      message: 'Suspicious payment activity detected',
      activity,
      details,
    });
  }

  // Performance logging
  logPerformanceMetric(
    operation: string,
    duration: number,
    details?: any,
  ): void {
    this.logger.log({
      message: 'Payment performance metric',
      operation,
      duration,
      details,
    });
  }

  // Audit logging
  logAuditEvent(event: string, userId: number, details: any): void {
    this.logger.log({
      message: 'Payment audit event',
      event,
      userId,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
