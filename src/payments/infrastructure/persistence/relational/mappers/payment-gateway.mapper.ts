import { PaymentGateway } from 'src/payments/domain/payment-gateway';
import { PaymentGatewayEntity } from '../entities/payment-gateway.entity';

export class PaymentGatewayMapper {
  static toDomain(entity: PaymentGatewayEntity): PaymentGateway {
    return {
      id: entity.id,
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description,
      isActive: entity.isActive,
      isDefault: entity.isDefault,
      logoUrl: entity.logoUrl,
      website: entity.website,
      supportedCurrencies: entity.supportedCurrencies,
      supportedCountries: entity.supportedCountries,
      minAmount: entity.minAmount,
      maxAmount: entity.maxAmount,
      processingFee: entity.processingFee,
      processingFeeType: entity.processingFeeType,
      sortOrder: entity.sortOrder,
      configSchema: entity.configSchema,
      webhookUrl: entity.webhookUrl,
      testMode: entity.testMode,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static toEntity(
    domain: Partial<PaymentGateway>,
  ): Partial<PaymentGatewayEntity> {
    return {
      id: domain.id,
      name: domain.name,
      displayName: domain.displayName,
      description: domain.description,
      isActive: domain.isActive,
      isDefault: domain.isDefault,
      logoUrl: domain.logoUrl,
      website: domain.website,
      supportedCurrencies: domain.supportedCurrencies,
      supportedCountries: domain.supportedCountries,
      minAmount: domain.minAmount,
      maxAmount: domain.maxAmount,
      processingFee: domain.processingFee,
      processingFeeType: domain.processingFeeType,
      sortOrder: domain.sortOrder,
      configSchema: domain.configSchema,
      webhookUrl: domain.webhookUrl,
      testMode: domain.testMode,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
    };
  }

  static toPersistence(
    domain: Partial<PaymentGateway>,
  ): Partial<PaymentGatewayEntity> {
    return this.toEntity(domain);
  }
}
