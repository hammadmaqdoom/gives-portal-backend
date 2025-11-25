export class PaymentGateway {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  logoUrl?: string;
  website?: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  minAmount?: number;
  maxAmount?: number;
  processingFee: number;
  processingFeeType: 'percentage' | 'fixed';
  sortOrder: number;
  configSchema?: any;
  webhookUrl?: string;
  testMode: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
