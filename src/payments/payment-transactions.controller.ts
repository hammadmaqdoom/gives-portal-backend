import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Headers,
  Logger,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { PaymentTransaction } from './domain/payment-transaction';
import { PaymentsService } from './payments.service';
import { WebhookService } from './infrastructure/webhooks/webhook.service';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';
import { InvoicesService } from '../invoices/invoices.service';
import { FilesService } from '../files/files.service';

@ApiTags('Payment Transactions')
@Controller({
  path: 'payment-transactions',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PaymentTransactionsController {
  private readonly logger = new Logger(PaymentTransactionsController.name);

  constructor(
    private paymentsService: PaymentsService,
    private webhookService: WebhookService,
    private studentsService: StudentsService,
    private parentsService: ParentsService,
    private invoicesService: InvoicesService,
    private configService: ConfigService,
    private filesService: FilesService,
  ) {}

  @Post('create-session')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Create payment session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment session created successfully',
  })
  async createPaymentSession(
    @Body()
    body: {
      gatewayId: number;
      invoiceId?: number;
      amount: number;
      currency: string;
      customerInfo?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
      };
    },
    @Request() req: any,
  ): Promise<{
    sessionToken: string;
    authToken: string;
    checkoutUrl: string;
    transactionId: string;
  }> {
    const { gatewayId, invoiceId, amount, currency, customerInfo } = body;
    const userId = req.user?.id;
    const userRole = req.user?.role?.name?.toLowerCase();

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    // Find the actual student ID based on user role and user ID
    let studentId: number | null = null;
    let parentId: number | null = null;

    if (userRole === 'student' || userRole === 'user') {
      // Find student by userId
      const student = await this.studentsService.findByUserId(userId);
      if (student) {
        studentId = student.id;
      }
    } else if (userRole === 'parent') {
      // Find parent by userId
      const parent = await this.parentsService.findByUserId(userId);
      if (parent) {
        parentId = parent.id;
        // For parent payments, we might need to get student ID from invoice
        if (invoiceId) {
          const invoice = await this.invoicesService.findById(invoiceId);
          if (invoice && invoice.studentId) {
            studentId = invoice.studentId;
          }
        }
      }
    }

    if (!studentId && !parentId) {
      throw new Error('Student or Parent record not found for this user');
    }

    // Check for existing pending transaction for idempotency
    const existingTransaction =
      await this.paymentsService.findExistingPendingTransaction({
        invoiceId,
        studentId: studentId || undefined,
        parentId: parentId || undefined,
        gatewayId,
        amount,
        currency,
      });

    if (existingTransaction) {
      // Return existing session if transaction is still pending
      if (existingTransaction.status === 'pending') {
        const gateway = await this.paymentsService.getGatewayById(gatewayId);
        const credentials =
          await this.paymentsService.getActiveCredentials(gatewayId);

        if (credentials) {
          const session = await this.paymentsService.createPaymentSession(
            gateway,
            credentials,
            existingTransaction,
            customerInfo,
          );

          return {
            sessionToken: session.sessionToken,
            authToken: session.authToken,
            checkoutUrl: session.checkoutUrl,
            transactionId: existingTransaction.transactionId,
          };
        }
      }

      // If transaction exists but is not pending, throw error
      throw new Error(
        `Payment already exists for this invoice with status: ${existingTransaction.status}`,
      );
    }

    // Get gateway and credentials
    const gateway = await this.paymentsService.getGatewayById(gatewayId);
    const credentials =
      await this.paymentsService.getActiveCredentials(gatewayId);

    if (!credentials) {
      throw new Error('No active credentials found for this gateway');
    }

    // Debug: Log payment details
    console.log('🔍 Payment Details:', {
      gatewayId,
      invoiceId,
      amount,
      currency,
      studentId,
      parentId,
    });

    // Create transaction record
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction = await this.paymentsService.createTransaction({
      transactionId,
      gatewayId,
      invoiceId,
      studentId: studentId || undefined,
      parentId: parentId || undefined,
      amount,
      currency,
      status: 'pending',
      callbackUrl: `${this.configService.get('APP_URL', { infer: true }) || this.configService.get('FRONTEND_DOMAIN', { infer: true }) || 'http://localhost:3000'}/payment/callback`,
    });

    // Create payment session
    const session = await this.paymentsService.createPaymentSession(
      gateway,
      credentials,
      transaction,
      customerInfo,
    );

    // Update transaction with Safepay tracker ID
    if (session.sessionToken) {
      await this.paymentsService.updateTransaction(transaction.id, {
        gatewayTransactionId: session.sessionToken,
      });
      this.logger.log(
        `Updated transaction ${transaction.id} with Safepay tracker: ${session.sessionToken}`,
      );
    }

    return {
      sessionToken: session.sessionToken,
      authToken: session.authToken,
      checkoutUrl: session.checkoutUrl,
      transactionId: transaction.transactionId,
    };
  }

  @Post('webhook/:gatewayName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle payment webhook' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  handleWebhook(
    @Param('gatewayName') _gatewayName: string,
    @Body() _webhookData: any,
    @Request() _req: any,
  ): { success: boolean; message: string } {
    // Implementation will be added
    return { success: true, message: 'Webhook processed successfully' };
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get payment transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment transactions retrieved successfully',
    type: [PaymentTransaction],
  })
  async getTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('gatewayId') gatewayId?: number,
    @Query('studentId') studentId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    data: PaymentTransaction[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.paymentsService.getTransactionsWithFilters({
      page,
      limit,
      status,
      gatewayId,
      studentId,
      startDate,
      endDate,
    });
  }

  // Admin-friendly flat response for dashboard tables
  @Get('admin/flat')
  @Roles(RoleEnum.admin)
  @ApiOperation({
    summary: 'Get payment transactions (flat view for dashboard)',
  })
  async getTransactionsFlat(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('gatewayId') gatewayId?: number,
    @Query('classId') classId?: number,
    @Query('teacherId') teacherId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { data, meta } = await this.paymentsService.getTransactionsWithJoins({
      page,
      limit,
      status,
      gatewayId,
      classId,
      teacherId,
      startDate,
      endDate,
    });

    // Map to flat structure
    const flat = data.map((t: any) => ({
      id: t.id,
      transactionId: t.transactionId,
      gatewayTransactionId: t.gatewayTransactionId,
      gatewayId: t.gatewayId,
      gatewayName: t.gateway?.name || '',
      gatewayDisplayName: t.gateway?.displayName || '',
      gatewayLogoUrl: t.gateway?.logoUrl || '',
      invoiceNumber: t.invoice?.invoiceNumber || '',
      studentName: t.student?.name || '',
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      paymentMethod: t.paymentMethod || '',
      processedAt: t.processedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      gatewayResponse: t.gatewayResponse || null,
    }));

    return { data: flat, meta };
  }

  @Get('my-transactions')
  @Roles(RoleEnum.user)
  @ApiOperation({ summary: 'Get my payment transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'My payment transactions retrieved successfully',
    type: [PaymentTransaction],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getMyTransactions(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    data: PaymentTransaction[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    // Get student ID from user ID
    const student = await this.studentsService.findByUserId(
      parseInt(req.user?.id, 10),
    );
    if (!student) {
      throw new Error('Student profile not found for current user');
    }

    return this.paymentsService.getUserTransactions(student.id, {
      page,
      limit,
      status,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get payment transaction by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment transaction retrieved successfully',
    type: PaymentTransaction,
  })
  async getTransactionById(
    @Param('id') id: string,
  ): Promise<PaymentTransaction> {
    return this.paymentsService.getTransactionById(+id);
  }

  @Patch(':id/refund')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Refund payment transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment refunded successfully',
    type: PaymentTransaction,
  })
  refundTransaction(
    @Param('id') _id: string,
    @Body() _body: { amount?: number; reason?: string },
  ): Promise<PaymentTransaction> {
    // Implementation will be added
    throw new Error('Refund functionality not implemented yet');
  }

  @Post('webhook/safepay')
  @ApiOperation({ summary: 'Safepay webhook endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  async handleSafepayWebhook(
    @Body() webhookData: any,
    @Headers('x-safepay-signature') signature: string,
    @Request() _req: any,
  ): Promise<{ success: boolean; message: string }> {
    // Get Safepay credentials
    const safepayGateway = await this.paymentsService.findByName('safepay');
    if (!safepayGateway) {
      throw new Error('Safepay gateway not found');
    }

    const credentials = await this.paymentsService.getActiveCredentials(
      safepayGateway.id,
    );
    if (!credentials) {
      throw new Error('Safepay credentials not found');
    }

    return this.webhookService.processSafepayWebhook(
      webhookData,
      signature,
      credentials,
    );
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  async handleStripeWebhook(
    @Body() webhookData: any,
    @Headers('stripe-signature') signature: string,
    @Request() _req: any,
  ): Promise<{ success: boolean; message: string }> {
    // Get Stripe credentials
    const stripeGateway = await this.paymentsService.findByName('stripe');
    if (!stripeGateway) {
      throw new Error('Stripe gateway not found');
    }

    const credentials = await this.paymentsService.getActiveCredentials(
      stripeGateway.id,
    );
    if (!credentials) {
      throw new Error('Stripe credentials not found');
    }

    return this.webhookService.processStripeWebhook(
      webhookData,
      signature,
      credentials,
    );
  }

  @Post('webhook/:gatewayName')
  @ApiOperation({ summary: 'Generic webhook endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  async handleGenericWebhook(
    @Param('gatewayName') gatewayName: string,
    @Body() webhookData: any,
    @Headers() headers: any,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    // Log incoming webhook request
    this.logger.log('=== WEBHOOK REQUEST RECEIVED ===');
    this.logger.log('Gateway:', gatewayName);
    this.logger.log('Timestamp:', new Date().toISOString());
    this.logger.log('IP Address:', req.ip || req.connection?.remoteAddress);
    this.logger.log('User Agent:', req.headers['user-agent']);
    this.logger.log('Headers:', JSON.stringify(headers, null, 2));
    this.logger.log('Body:', JSON.stringify(webhookData, null, 2));
    this.logger.log('================================');

    // Get gateway by name
    const gateway = await this.paymentsService.findByName(gatewayName);
    if (!gateway) {
      this.logger.error(`❌ Gateway ${gatewayName} not found`);
      throw new Error(`Gateway ${gatewayName} not found`);
    }

    const credentials = await this.paymentsService.getActiveCredentials(
      gateway.id,
    );
    if (!credentials) {
      this.logger.error(`❌ ${gatewayName} credentials not found`);
      throw new Error(`${gatewayName} credentials not found`);
    }

    this.logger.log(
      `✅ Gateway ${gatewayName} and credentials found, routing to handler`,
    );

    // Route to appropriate webhook handler based on gateway name
    switch (gatewayName.toLowerCase()) {
      case 'safepay':
        const safepaySignature = headers['x-safepay-signature'];
        this.logger.log('🔄 Routing to Safepay webhook handler');
        return this.webhookService.processSafepayWebhook(
          webhookData,
          safepaySignature,
          credentials,
        );

      case 'stripe':
        const stripeSignature = headers['stripe-signature'];
        return this.webhookService.processStripeWebhook(
          webhookData,
          stripeSignature,
          credentials,
        );

      default:
        throw new Error(`Unsupported gateway: ${gatewayName}`);
    }
  }

  @Post('cleanup-expired')
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Clean up expired pending transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expired transactions cleaned up successfully',
  })
  async cleanupExpiredTransactions(): Promise<{ message: string }> {
    await this.paymentsService.cleanupExpiredPendingTransactions();
    return { message: 'Expired transactions cleaned up successfully' };
  }

  @Post('verify-payment')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Verify payment completion using tracker' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  async verifyPayment(
    @Body() body: { tracker: string; gatewayId: number },
  ): Promise<{
    success: boolean;
    status: string;
    message: string;
    trackerData?: any;
  }> {
    const { tracker, gatewayId } = body;

    // Get gateway and credentials
    const gateway = await this.paymentsService.getGatewayById(gatewayId);
    const credentials =
      await this.paymentsService.getActiveCredentials(gatewayId);

    if (!credentials) {
      throw new Error('No active credentials found for gateway');
    }

    // Get payment details using Safepay reporter API
    const safepayService = this.paymentsService.getGatewayService(gateway);
    if (!safepayService) {
      throw new Error('Safepay service not available');
    }

    return await safepayService.getPaymentDetails(tracker, credentials);
  }

  @Post('bank-transfer')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create bank transfer payment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bank transfer payment created successfully',
    type: PaymentTransaction,
  })
  async createBankTransferPayment(
    @Request() req: any,
    @Body()
    body: {
      amount: number;
      currency: string;
      invoiceId?: number;
      referenceNumber?: string;
    },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PaymentTransaction> {
    try {
      this.logger.log('Creating bank transfer payment:', {
        userId: req.user?.id,
        amount: body.amount,
        currency: body.currency,
        invoiceId: body.invoiceId,
        referenceNumber: body.referenceNumber,
      });

      // Resolve studentId: prefer current user's student; fallback to invoice.studentId for admin/parent flows
      let resolvedStudentId: number | null = null;
      const student = await this.studentsService.findByUserId(
        parseInt(req.user?.id, 10),
      );
      if (student) {
        resolvedStudentId = student.id;
      } else if (body.invoiceId) {
        const invoice = await this.invoicesService.findById(body.invoiceId);
        if (invoice && (invoice as any).studentId) {
          resolvedStudentId = (invoice as any).studentId;
        }
      }
      if (!resolvedStudentId) {
        throw new Error(
          'Student profile not found to attribute bank transfer payment',
        );
      }

      // Validate file
      if (!file) {
        throw new Error('Payment proof file is required');
      }

      // Upload file and persist record in files table
      const fileInfo = await this.filesService.uploadFileWithContext(file, {
        type: 'payment-proof',
        id: `bank-transfer-${Date.now()}`,
        userId: req.user?.id,
      });

      this.logger.log('File uploaded successfully:', {
        id: (fileInfo as any)?.id,
        path: (fileInfo as any)?.path,
      });

      // Build previewable file URL (serve endpoint)
      // Always build preview URL from backend origin (not frontend)
      const backendOrigin = `${req.protocol}://${req.get('host')}`;
      const previewUrl = (fileInfo as any)?.id
        ? `${backendOrigin}/api/v1/files/serve/${fileInfo.id}`
        : (fileInfo as any)?.url || (fileInfo as any)?.path;

      // Create bank transfer payment
      const transaction = await this.paymentsService.createBankTransferPayment(
        resolvedStudentId,
        body.amount,
        body.currency,
        body.referenceNumber,
        previewUrl,
        body.invoiceId,
        {
          id: (fileInfo as any)?.id,
          originalName: (fileInfo as any)?.originalName,
          mimeType: (fileInfo as any)?.mimeType,
          size: (fileInfo as any)?.size,
        },
      );

      this.logger.log(
        'Bank transfer payment created successfully:',
        transaction.transactionId,
      );

      return transaction;
    } catch (error) {
      this.logger.error('Failed to create bank transfer payment:', error);
      throw error;
    }
  }

  @Patch(':id/status')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({
    summary: 'Manually update bank-transfer transaction status (paid/unpaid)',
  })
  async updateBankTransferStatus(
    @Param('id') id: string,
    @Body() body: { status: 'completed' | 'pending' },
  ): Promise<PaymentTransaction> {
    const tx = await this.paymentsService.getTransactionById(+id);
    if (!tx) {
      throw new Error('Transaction not found');
    }
    if ((tx.paymentMethod || '').toLowerCase() !== 'bank-transfer') {
      throw new Error(
        'Only bank-transfer transactions can be manually updated',
      );
    }
    const update: Partial<PaymentTransaction> = {
      status: body.status,
      processedAt:
        body.status === 'completed' ? (new Date() as any) : (null as any),
    };
    return this.paymentsService.updateTransaction(tx.id, update);
  }
}
