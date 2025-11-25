export class PaymentGatewayCredentials {
  id: number;
  gatewayId: number;
  environment: 'sandbox' | 'production';
  apiKey: string;
  secretKey: string;
  webhookSecret?: string;
  additionalConfig?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
