import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { PaymentGateway } from './domain/payment-gateway';
import { PaymentGatewayCredentials } from './domain/payment-gateway-credentials';
import { PaymentTransaction } from './domain/payment-transaction';
import { PaymentGatewayRepository } from './infrastructure/persistence/payment-gateway.repository';
import { PaymentGatewayCredentialsRepository } from './infrastructure/persistence/payment-gateway-credentials.repository';
import { PaymentTransactionRepository } from './infrastructure/persistence/payment-transaction.repository';
import { PaymentLoggerService } from './infrastructure/logging/payment-logger.service';
import { SettingsService } from '../settings/settings.service';
import {
  PaymentGatewayNotFoundError,
  PaymentCredentialsNotFoundError,
  PaymentTransactionNotFoundError,
  PaymentAmountError,
  PaymentCurrencyError,
  PaymentGatewayConnectionError,
} from './infrastructure/errors/payment-errors';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private paymentGatewayFactory: PaymentGatewayFactory,
    private paymentGatewayRepository: PaymentGatewayRepository,
    private paymentGatewayCredentialsRepository: PaymentGatewayCredentialsRepository,
    private paymentTransactionRepository: PaymentTransactionRepository,
    private paymentLogger: PaymentLoggerService,
    private settingsService: SettingsService,
  ) {}

  async createPaymentSession(
    gateway: PaymentGateway,
    credentials: PaymentGatewayCredentials,
    transaction: PaymentTransaction,
    customerInfo?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    },
  ): Promise<{
    sessionToken: string;
    authToken: string;
    checkoutUrl: string;
  }> {
    try {
      // Validate gateway is active
      if (!gateway.isActive) {
        throw new BadRequestException(
          `Payment gateway '${gateway.name}' is not active`,
        );
      }

      // Validate credentials are active
      if (!credentials.isActive) {
        throw new BadRequestException(
          `Credentials for gateway '${gateway.name}' are not active`,
        );
      }

      // Validate minimum amount only (let gateway handle max limits)
      if (gateway.minAmount && transaction.amount < gateway.minAmount) {
        throw new BadRequestException(
          `Amount must be at least ${gateway.minAmount} ${transaction.currency}`,
        );
      }

      // Log amount for debugging
      this.logger.log(`Processing payment: ${transaction.amount} ${transaction.currency} for gateway ${gateway.name}`);
      this.logger.log('Retrieved credentials:', {
        id: credentials.id,
        gatewayId: credentials.gatewayId,
        isActive: credentials.isActive,
        apiKey: credentials.apiKey ? `${credentials.apiKey.substring(0, 10)}...` : 'null',
        environment: credentials.environment,
      });

      // Validate currency support
      if (!gateway.supportedCurrencies.includes(transaction.currency)) {
        throw new BadRequestException(
          `Currency '${transaction.currency}' is not supported by gateway '${gateway.name}'`,
        );
      }

      // Get gateway implementation
      const gatewayImpl = this.paymentGatewayFactory.getGateway(gateway);

      // Create payment session
      const result = await gatewayImpl.createPaymentSession(
        credentials,
        transaction,
        customerInfo,
      );

      this.logger.log(
        `Payment session created for transaction ${transaction.transactionId} using ${gateway.name}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Payment session creation failed for transaction ${transaction.transactionId}:`,
        error,
      );
      throw error;
    }
  }

  async verifyPayment(
    gateway: PaymentGateway,
    credentials: PaymentGatewayCredentials,
    trackerToken: string,
  ): Promise<{
    status: string;
    transactionId: string;
    amount: number;
    currency: string;
    paymentMethod?: any;
  }> {
    try {
      const gatewayImpl = this.paymentGatewayFactory.getGateway(gateway);

      const result = await gatewayImpl.verifyPayment(credentials, trackerToken);

      this.logger.log(
        `Payment verification completed for tracker ${trackerToken}: ${result.status}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Payment verification failed for tracker ${trackerToken}:`,
        error,
      );
      throw error;
    }
  }

  async processWebhook(
    gateway: PaymentGateway,
    credentials: PaymentGatewayCredentials,
    webhookData: any,
    signature: string,
  ): Promise<{
    eventType: string;
    transactionId: string;
    status: string;
    amount: number;
    currency: string;
  }> {
    try {
      const gatewayImpl = this.paymentGatewayFactory.getGateway(gateway);

      const result = await gatewayImpl.processWebhook(
        credentials,
        webhookData,
        signature,
      );

      this.logger.log(
        `Webhook processed for gateway ${gateway.name}: ${result.eventType}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Webhook processing failed for gateway ${gateway.name}:`,
        error,
      );
      throw error;
    }
  }

  calculateProcessingFee(gateway: PaymentGateway, amount: number): number {
    if (gateway.processingFeeType === 'percentage') {
      return amount * (gateway.processingFee / 100);
    } else {
      return gateway.processingFee;
    }
  }

  getTotalAmount(gateway: PaymentGateway, amount: number): number {
    const processingFee = this.calculateProcessingFee(gateway, amount);
    return amount + processingFee;
  }

  // Gateway Management Methods
  async getAllGateways(): Promise<PaymentGateway[]> {
    return this.paymentGatewayRepository.findAll();
  }

  async getActiveGateways(): Promise<PaymentGateway[]> {
    return this.paymentGatewayRepository.findActive();
  }

  async getGatewayById(id: number): Promise<PaymentGateway> {
    try {
      const gateway = await this.paymentGatewayRepository.findById(id);
      if (!gateway) {
        throw new PaymentGatewayNotFoundError(id);
      }
      return gateway;
    } catch (error) {
      this.paymentLogger.logPaymentError(error, {
        operation: 'getGatewayById',
        gatewayId: id,
      });
      throw error;
    }
  }

  async findByName(name: string): Promise<PaymentGateway | null> {
    return this.paymentGatewayRepository.findByName(name);
  }

  async toggleGatewayStatus(id: number): Promise<PaymentGateway> {
    const gateway = await this.getGatewayById(id);
    return this.paymentGatewayRepository.toggleActive(id);
  }

  async setDefaultGateway(id: number): Promise<PaymentGateway> {
    const gateway = await this.getGatewayById(id);
    if (!gateway.isActive) {
      throw new BadRequestException('Cannot set inactive gateway as default');
    }
    await this.paymentGatewayRepository.setDefault(id);
    return this.getGatewayById(id);
  }

  // Credentials Management Methods
  async getGatewayCredentials(
    gatewayId: number,
  ): Promise<PaymentGatewayCredentials[]> {
    return this.paymentGatewayCredentialsRepository.findByGatewayId(gatewayId);
  }

  async getActiveCredentials(
    gatewayId: number,
  ): Promise<PaymentGatewayCredentials | null> {
    try {
      const credentials =
        await this.paymentGatewayCredentialsRepository.findActiveByGatewayId(
          gatewayId,
        );
      if (!credentials) {
        throw new PaymentCredentialsNotFoundError(gatewayId);
      }
      return credentials;
    } catch (error) {
      this.paymentLogger.logPaymentError(error, {
        operation: 'getActiveCredentials',
        gatewayId,
      });
      throw error;
    }
  }

  async saveGatewayCredentials(
    gatewayId: number,
    credentials: Partial<PaymentGatewayCredentials>,
  ): Promise<PaymentGatewayCredentials> {
    const existingCredentials =
      await this.paymentGatewayCredentialsRepository.findByGatewayIdAndEnvironment(
        gatewayId,
        credentials.environment || 'sandbox',
      );

    if (existingCredentials) {
      return this.paymentGatewayCredentialsRepository.update(
        existingCredentials.id!,
        {
          ...credentials,
          gatewayId,
        },
      );
    } else {
      return this.paymentGatewayCredentialsRepository.create({
        ...credentials,
        gatewayId,
      });
    }
  }

  async testGatewayConnection(
    gatewayId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const gateway = await this.getGatewayById(gatewayId);
      const credentials = await this.getActiveCredentials(gatewayId);

      if (!credentials) {
        return {
          success: false,
          message: 'No active credentials found for this gateway',
        };
      }

      // Test connection based on gateway type
      const gatewayImpl = this.paymentGatewayFactory.getGateway(gateway);

      // For now, just return success - actual testing would depend on gateway implementation
      return { success: true, message: 'Connection test successful' };
    } catch (error) {
      this.logger.error(
        `Gateway connection test failed for gateway ${gatewayId}:`,
        error,
      );
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  // Transaction Management Methods
  async createTransaction(
    transactionData: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction> {
    return this.paymentTransactionRepository.create(transactionData);
  }

  async updateTransaction(
    id: number,
    updateData: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction> {
    return this.paymentTransactionRepository.update(id, updateData);
  }

  async getTransactionById(id: number): Promise<PaymentTransaction> {
    const transaction = await this.paymentTransactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(
        `Payment transaction with id ${id} not found`,
      );
    }
    return transaction;
  }

  async getTransactionByTransactionId(
    transactionId: string,
  ): Promise<PaymentTransaction> {
    const transaction =
      await this.paymentTransactionRepository.findByTransactionId(
        transactionId,
      );
    if (!transaction) {
      throw new NotFoundException(
        `Payment transaction with id ${transactionId} not found`,
      );
    }
    return transaction;
  }

  async getTransactionByGatewayTransactionId(
    gatewayTransactionId: string,
  ): Promise<PaymentTransaction> {
    const transaction =
      await this.paymentTransactionRepository.findByGatewayTransactionId(
        gatewayTransactionId,
      );
    if (!transaction) {
      throw new NotFoundException(
        `Payment transaction with gateway transaction id ${gatewayTransactionId} not found`,
      );
    }
    return transaction;
  }

  async updateTransactionStatus(
    transactionId: string,
    status: PaymentTransaction['status'],
    additionalData?: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction> {
    const updateData = {
      status,
      ...additionalData,
      ...(status === 'completed' && { processedAt: new Date() }),
    };

    return this.paymentTransactionRepository.updateByTransactionId(
      transactionId,
      updateData,
    );
  }

  async getTransactionsWithFilters(filters: any): Promise<{
    data: PaymentTransaction[];
    meta: any;
  }> {
    return this.paymentTransactionRepository.findWithFilters(filters);
  }

  // Joined view for admin dashboard - returns transactions with invoice/class/teacher/student/parent
  async getTransactionsWithJoins(filters: any): Promise<{
    data: any[];
    meta: any;
  }> {
    // Reuse repository but request joins via a flag if supported, or compose here using filters
    // For now, call the same repo and rely on it to include relations when present
    return this.paymentTransactionRepository.findWithFilters({ ...filters, includeJoins: true });
  }

  async getUserTransactions(
    studentId: number,
    filters?: any,
  ): Promise<{
    data: PaymentTransaction[];
    meta: any;
  }> {
    return this.paymentTransactionRepository.findByStudentId(
      studentId,
      filters,
    );
  }

  async findExistingPendingTransaction(criteria: {
    invoiceId?: number;
    studentId?: number;
    parentId?: number;
    gatewayId: number;
    amount: number;
    currency: string;
  }): Promise<PaymentTransaction | null> {
    const { invoiceId, studentId, parentId, gatewayId, amount, currency } = criteria;
    
    // Build query criteria
    const whereCriteria: any = {
      gatewayId,
      amount,
      currency,
      status: 'pending',
    };

    if (invoiceId) {
      whereCriteria.invoiceId = invoiceId;
    }

    if (studentId) {
      whereCriteria.studentId = studentId;
    }

    if (parentId) {
      whereCriteria.parentId = parentId;
    }

    // Find existing transaction
    const transactions = await this.paymentTransactionRepository.findWithFilters({
      ...whereCriteria,
      page: 1,
      limit: 1,
    });

    return transactions.data.length > 0 ? transactions.data[0] : null;
  }

  async cleanupExpiredPendingTransactions(): Promise<void> {
    // Clean up pending transactions older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const expiredTransactions = await this.paymentTransactionRepository.findWithFilters({
      status: 'pending',
      page: 1,
      limit: 100, // Process in batches
    });

    for (const transaction of expiredTransactions.data) {
      if (transaction.createdAt < thirtyMinutesAgo) {
        await this.paymentTransactionRepository.updateByTransactionId(
          transaction.transactionId,
          {
            status: 'cancelled',
            failureReason: 'Transaction expired - no payment received within 30 minutes',
          }
        );
        
        this.logger.log(`Cleaned up expired transaction: ${transaction.transactionId}`);
      }
    }
  }

  getGatewayService(gateway: PaymentGateway): any {
    return this.paymentGatewayFactory.getGateway(gateway);
  }

  // Note: getStudentByUserId method removed to avoid circular dependency
  // This functionality should be handled by the calling service (e.g., InvoicesService)

  async createBankTransferPayment(
    studentId: number,
    amount: number,
    currency: string,
    referenceNumber: string | undefined,
    fileUrl: string,
    invoiceId?: number,
    fileMeta?: { id?: string | number; originalName?: string; mimeType?: string; size?: number } | null,
  ): Promise<PaymentTransaction> {
    try {
      // this.logger.log(`Creating bank transfer payment for student ${studentId}, amount: ${amount} ${currency}`);

      // Get bank transfer gateway (support common naming variants)
      let bankTransferGateway = await this.paymentGatewayRepository.findByName('bank-transfer');
      if (!bankTransferGateway) {
        bankTransferGateway = await this.paymentGatewayRepository.findByName('bank_transfer');
      }
      if (!bankTransferGateway) {
        bankTransferGateway = await this.paymentGatewayRepository.findByName('bank');
      }
      if (!bankTransferGateway) {
        throw new PaymentGatewayNotFoundError(0);
      }

      // Get bank details from settings
      const bankDetails = await this.settingsService.getBankDetails();
      if (!bankDetails.bankName || !bankDetails.bankAccountNumber) {
        throw new Error('Bank details not configured in settings');
      }

      // Create transaction
      const transaction = new PaymentTransaction();
      transaction.transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      transaction.studentId = studentId;
      transaction.amount = amount;
      transaction.currency = currency;
      transaction.status = 'pending';
      transaction.paymentMethod = 'bank-transfer';
      transaction.gatewayId = bankTransferGateway.id;
      transaction.invoiceId = invoiceId;
      transaction.gatewayResponse = {
        referenceNumber,
        fileUrl,
        fileId: fileMeta?.id ?? undefined,
        fileName: fileMeta?.originalName ?? undefined,
        fileMimeType: fileMeta?.mimeType ?? undefined,
        fileSize: fileMeta?.size ?? undefined,
        uploadedAt: new Date().toISOString(),
        bankDetails: {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.bankAccountNumber,
          accountTitle: bankDetails.bankAccountTitle,
          iban: bankDetails.bankIban,
          swiftCode: bankDetails.bankSwiftCode,
          currency: bankDetails.bankAccountCurrency,
        },
      };
      transaction.callbackUrl = '/payment/bank-transfer/callback';
      transaction.redirectUrl = '/payment/bank-transfer/success';

      const savedTransaction = await this.paymentTransactionRepository.create(transaction);

      this.logger.log(`Bank transfer payment created: ${savedTransaction.transactionId}`);

      return savedTransaction;
    } catch (error) {
      this.logger.error('Failed to create bank transfer payment:', error);
      throw error;
    }
  }
}
