import { PaymentTransaction } from 'src/payments/domain/payment-transaction';
import { PaymentTransactionEntity } from '../entities/payment-transaction.entity';

export class PaymentTransactionMapper {
  static toDomain(entity: PaymentTransactionEntity): PaymentTransaction {
    return {
      id: entity.id,
      transactionId: entity.transactionId,
      gatewayTransactionId: entity.gatewayTransactionId,
      gatewayId: entity.gatewayId,
      invoiceId: entity.invoiceId,
      studentId: entity.studentId,
      parentId: entity.parentId,
      amount: entity.amount,
      currency: entity.currency,
      status: entity.status,
      paymentMethod: entity.paymentMethod,
      gatewayResponse: entity.gatewayResponse,
      webhookData: entity.webhookData,
      redirectUrl: entity.redirectUrl,
      callbackUrl: entity.callbackUrl,
      failureReason: entity.failureReason,
      processedAt: entity.processedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
      gateway: entity.gateway ? {
        id: entity.gateway.id,
        name: entity.gateway.name,
        displayName: entity.gateway.displayName,
        logoUrl: entity.gateway.logoUrl,
      } : undefined,
    };
  }

  static toEntity(
    domain: Partial<PaymentTransaction>,
  ): Partial<PaymentTransactionEntity> {
    return {
      id: domain.id,
      transactionId: domain.transactionId,
      gatewayTransactionId: domain.gatewayTransactionId,
      gatewayId: domain.gatewayId,
      invoiceId: domain.invoiceId,
      studentId: domain.studentId,
      parentId: domain.parentId,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      paymentMethod: domain.paymentMethod,
      gatewayResponse: domain.gatewayResponse,
      webhookData: domain.webhookData,
      redirectUrl: domain.redirectUrl,
      callbackUrl: domain.callbackUrl,
      failureReason: domain.failureReason,
      processedAt: domain.processedAt,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
    };
  }

  static toPersistence(
    domain: Partial<PaymentTransaction>,
  ): Partial<PaymentTransactionEntity> {
    return this.toEntity(domain);
  }
}
