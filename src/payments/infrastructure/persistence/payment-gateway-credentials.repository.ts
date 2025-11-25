import { PaymentGatewayCredentials } from '../../domain/payment-gateway-credentials';

export abstract class PaymentGatewayCredentialsRepository {
  abstract findByGatewayId(
    gatewayId: number,
  ): Promise<PaymentGatewayCredentials[]>;
  abstract findByGatewayIdAndEnvironment(
    gatewayId: number,
    environment: string,
  ): Promise<PaymentGatewayCredentials | null>;
  abstract findActiveByGatewayId(
    gatewayId: number,
  ): Promise<PaymentGatewayCredentials | null>;
  abstract create(
    data: Partial<PaymentGatewayCredentials>,
  ): Promise<PaymentGatewayCredentials>;
  abstract update(
    id: number,
    data: Partial<PaymentGatewayCredentials>,
  ): Promise<PaymentGatewayCredentials>;
  abstract delete(id: number): Promise<void>;
  abstract toggleActive(id: number): Promise<PaymentGatewayCredentials>;
}
