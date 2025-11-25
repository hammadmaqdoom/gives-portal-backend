import { PaymentGatewayCredentials } from 'src/payments/domain/payment-gateway-credentials';
import { PaymentGatewayCredentialsEntity } from '../entities/payment-gateway-credentials.entity';

export class PaymentGatewayCredentialsMapper {
  static toDomain(
    entity: PaymentGatewayCredentialsEntity,
  ): PaymentGatewayCredentials {
    return {
      id: entity.id,
      gatewayId: entity.gatewayId,
      environment: entity.environment,
      apiKey: entity.apiKey,
      secretKey: entity.secretKey,
      webhookSecret: entity.webhookSecret,
      additionalConfig: entity.additionalConfig,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toEntity(
    domain: Partial<PaymentGatewayCredentials>,
  ): Partial<PaymentGatewayCredentialsEntity> {
    return {
      id: domain.id,
      gatewayId: domain.gatewayId,
      environment: domain.environment,
      apiKey: domain.apiKey,
      secretKey: domain.secretKey,
      webhookSecret: domain.webhookSecret,
      additionalConfig: domain.additionalConfig,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
    };
  }

  static toPersistence(
    domain: Partial<PaymentGatewayCredentials>,
  ): Partial<PaymentGatewayCredentialsEntity> {
    return this.toEntity(domain);
  }
}
