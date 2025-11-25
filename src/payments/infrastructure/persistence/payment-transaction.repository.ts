import { PaymentTransaction } from '../../domain/payment-transaction';

export interface PaymentTransactionFilters {
  page?: number;
  limit?: number;
  status?: string;
  gatewayId?: number;
  studentId?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaymentTransactionMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class PaymentTransactionRepository {
  abstract findById(id: number): Promise<PaymentTransaction | null>;
  abstract findByTransactionId(
    transactionId: string,
  ): Promise<PaymentTransaction | null>;
  abstract findByGatewayTransactionId(
    gatewayTransactionId: string,
  ): Promise<PaymentTransaction | null>;
  abstract findWithFilters(filters: PaymentTransactionFilters): Promise<{
    data: PaymentTransaction[];
    meta: PaymentTransactionMeta;
  }>;
  abstract findByStudentId(
    studentId: number,
    filters?: Omit<PaymentTransactionFilters, 'studentId'>,
  ): Promise<{
    data: PaymentTransaction[];
    meta: PaymentTransactionMeta;
  }>;
  abstract create(
    data: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction>;
  abstract update(
    id: number,
    data: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction>;
  abstract updateByTransactionId(
    transactionId: string,
    data: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction>;
  abstract delete(id: number): Promise<void>;
}
