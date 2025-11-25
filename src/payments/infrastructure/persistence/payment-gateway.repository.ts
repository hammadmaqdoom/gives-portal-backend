import { PaymentGateway } from '../../domain/payment-gateway';

export abstract class PaymentGatewayRepository {
  abstract findById(id: number): Promise<PaymentGateway | null>;
  abstract findByName(name: string): Promise<PaymentGateway | null>;
  abstract findActive(): Promise<PaymentGateway[]>;
  abstract findAll(): Promise<PaymentGateway[]>;
  abstract create(data: Partial<PaymentGateway>): Promise<PaymentGateway>;
  abstract update(
    id: number,
    data: Partial<PaymentGateway>,
  ): Promise<PaymentGateway>;
  abstract delete(id: number): Promise<void>;
  abstract setDefault(id: number): Promise<void>;
  abstract toggleActive(id: number): Promise<PaymentGateway>;
}
