export class PaymentTransaction {
  id: number;
  transactionId: string;
  gatewayTransactionId?: string;
  gatewayId: number;
  invoiceId?: number;
  studentId: number;
  parentId?: number;
  amount: number;
  currency: string;
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'refunded';
  paymentMethod?: string;
  gatewayResponse?: any;
  webhookData?: any;
  redirectUrl?: string;
  callbackUrl?: string;
  failureReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  gateway?: {
    id: number;
    name: string;
    displayName: string;
    logoUrl?: string;
  };
}
