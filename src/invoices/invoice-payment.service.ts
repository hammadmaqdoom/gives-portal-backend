import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentTransaction } from '../payments/domain/payment-transaction';
import { Invoice } from './domain/invoice';
import { InvoiceStatus } from './domain/invoice';
import { MailService } from '../mail/mail.service';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';

@Injectable()
export class InvoicePaymentService {
  private readonly logger = new Logger(InvoicePaymentService.name);

  constructor(
    private invoicesService: InvoicesService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
    private mailService: MailService,
    private studentsService: StudentsService,
    private parentsService: ParentsService,
  ) {}

  async createPaymentSession(
    invoiceId: number,
    gatewayId: number,
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
    transactionId: string;
  }> {
    // Get invoice details
    const invoice = await this.invoicesService.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${invoiceId} not found`);
    }

    // Check if invoice is already paid
    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Invoice is already paid');
    }

    // Check if invoice is overdue
    if (invoice.status === InvoiceStatus.OVERDUE) {
      this.logger.warn(`Attempting to pay overdue invoice ${invoiceId}`);
    }

    // Get gateway and credentials
    const gateway = await this.paymentsService.getGatewayById(gatewayId);
    const credentials =
      await this.paymentsService.getActiveCredentials(gatewayId);

    if (!credentials) {
      throw new Error('Payment gateway credentials not found');
    }

    // Create transaction record
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction = await this.paymentsService.createTransaction({
      transactionId,
      gatewayId,
      invoiceId,
      studentId: invoice.studentId,
      parentId: invoice.parentId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: 'pending',
      callbackUrl: `${process.env.APP_URL}/payment/callback`,
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

    this.logger.log(
      `Payment session created for invoice ${invoiceId}: ${transaction.transactionId}`,
    );

    return {
      sessionToken: session.sessionToken,
      authToken: session.authToken,
      checkoutUrl: session.checkoutUrl,
      transactionId: transaction.transactionId,
    };
  }

  async processPaymentSuccess(transactionId: string): Promise<Invoice> {
    try {
      // Get transaction details
      const transaction =
        await this.paymentsService.getTransactionByTransactionId(transactionId);

      if (!transaction.invoiceId) {
        throw new Error('Transaction is not linked to an invoice');
      }

      // Get invoice
      const invoice = await this.invoicesService.findById(
        transaction.invoiceId,
      );
      if (!invoice) {
        throw new NotFoundException(
          `Invoice with id ${transaction.invoiceId} not found`,
        );
      }

      // Update invoice status to paid
      const updatedInvoice = await this.invoicesService.update(
        transaction.invoiceId,
        {
          status: InvoiceStatus.PAID,
          paidDate: new Date().toISOString(),
          paymentMethod: (transaction.paymentMethod as any) || 'online',
          transactionId: transaction.transactionId,
        },
      );

      this.logger.log(
        `Invoice ${transaction.invoiceId} marked as paid via transaction ${transactionId}`,
      );

      // Send payment confirmation email
      try {
        if (updatedInvoice) {
          await this.sendPaymentConfirmationEmail(updatedInvoice, transaction);
        }
      } catch (error) {
        this.logger.error('Error sending payment confirmation email:', error);
        // Don't fail the payment processing if email fails
      }

      return updatedInvoice!;
    } catch (error) {
      this.logger.error(
        `Error processing payment success for transaction ${transactionId}:`,
        error,
      );
      throw error;
    }
  }

  async processPaymentFailure(
    transactionId: string,
    reason?: string,
  ): Promise<void> {
    try {
      // Get transaction details
      const transaction =
        await this.paymentsService.getTransactionByTransactionId(transactionId);

      if (!transaction.invoiceId) {
        throw new Error('Transaction is not linked to an invoice');
      }

      // Get invoice
      const invoice = await this.invoicesService.findById(
        transaction.invoiceId,
      );
      if (!invoice) {
        throw new NotFoundException(
          `Invoice with id ${transaction.invoiceId} not found`,
        );
      }

      // Update invoice status to failed (if it was pending payment)
      if (invoice.status === InvoiceStatus.SENT) {
        await this.invoicesService.update(transaction.invoiceId, {
          status: InvoiceStatus.SENT, // Keep as sent, don't mark as failed
          notes: `Payment failed: ${reason || 'Unknown error'}`,
        });
      }

      this.logger.log(
        `Payment failed for invoice ${transaction.invoiceId}: ${reason}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing payment failure for transaction ${transactionId}:`,
        error,
      );
      throw error;
    }
  }

  async getInvoicePaymentHistory(
    invoiceId: number,
  ): Promise<PaymentTransaction[]> {
    try {
      // Get all payment transactions for this invoice
      const response = await this.paymentsService.getTransactionsWithFilters({
        invoiceId,
        page: 1,
        limit: 100, // Get all transactions for this invoice
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting payment history for invoice ${invoiceId}:`,
        error,
      );
      throw error;
    }
  }

  async getStudentPaymentHistory(
    studentId: number,
    filters?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{
    data: PaymentTransaction[];
    meta: any;
  }> {
    try {
      return await this.paymentsService.getUserTransactions(studentId, filters);
    } catch (error) {
      this.logger.error(
        `Error getting payment history for student ${studentId}:`,
        error,
      );
      throw error;
    }
  }

  async refundInvoicePayment(
    invoiceId: number,
    amount?: number,
    reason?: string,
  ): Promise<PaymentTransaction> {
    try {
      // Get invoice
      const invoice = await this.invoicesService.findById(invoiceId);
      if (!invoice) {
        throw new NotFoundException(`Invoice with id ${invoiceId} not found`);
      }

      if (invoice.status !== InvoiceStatus.PAID) {
        throw new Error('Invoice is not paid, cannot refund');
      }

      if (!invoice.transactionId) {
        throw new Error('Invoice has no associated transaction ID');
      }

      // Get the original transaction
      const originalTransaction =
        await this.paymentsService.getTransactionByTransactionId(
          invoice.transactionId,
        );

      // Create refund transaction
      const refundAmount = amount || invoice.amount;
      const refundTransaction = await this.paymentsService.createTransaction({
        transactionId: `refund_${originalTransaction.transactionId}_${Date.now()}`,
        gatewayId: originalTransaction.gatewayId,
        invoiceId: invoiceId,
        studentId: originalTransaction.studentId,
        parentId: originalTransaction.parentId,
        amount: -refundAmount, // Negative amount for refund
        currency: originalTransaction.currency,
        status: 'refunded',
        paymentMethod: originalTransaction.paymentMethod,
        failureReason: reason,
        processedAt: new Date(),
      });

      // Update invoice status
      await this.invoicesService.update(invoiceId, {
        status: InvoiceStatus.OVERDUE, // Mark as overdue after refund
        notes: `Refunded: ${reason || 'No reason provided'}`,
      });

      this.logger.log(
        `Refund processed for invoice ${invoiceId}: ${refundAmount}`,
      );

      return refundTransaction;
    } catch (error) {
      this.logger.error(
        `Error refunding payment for invoice ${invoiceId}:`,
        error,
      );
      throw error;
    }
  }

  private async sendPaymentConfirmationEmail(
    invoice: Invoice,
    transaction: PaymentTransaction,
  ): Promise<void> {
    try {
      this.logger.log(
        `Sending payment confirmation email for invoice ${invoice.id}`,
      );

      // Get student details
      const student = await this.studentsService.findById(invoice.studentId);
      if (!student) {
        this.logger.warn(`Student not found for invoice ${invoice.id}`);
        return;
      }

      // Get parent details
      let parent: any = null;
      if (invoice.parentId) {
        parent = await this.parentsService.findById(invoice.parentId);
      }

      // If no parent found, try to get parents from student
      if (!parent) {
        const parents = await this.parentsService.findByStudentId(
          invoice.studentId,
        );
        parent = parents && parents.length > 0 ? parents[0] : null;
      }

      // Collect email recipients
      const recipients: string[] = [];

      // Add student email if available
      if (student.email) {
        recipients.push(student.email);
      }

      // Add parent email if available
      if (parent && parent.email) {
        recipients.push(parent.email);
      }

      if (recipients.length === 0) {
        this.logger.warn(
          `No email addresses found for student or parent for invoice ${invoice.id}`,
        );
        return;
      }

      // Get payment gateway details for display
      const gateway = await this.paymentsService.getGatewayById(
        transaction.gatewayId,
      );
      const paymentMethod = gateway ? gateway.displayName : 'Online Payment';

      // Format amount with currency
      const amount = `${invoice.currency} ${transaction.amount.toFixed(2)}`;

      // Format payment date
      const paymentDate = new Date(transaction.updatedAt).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      );

      // Send email to all recipients
      const emailPromises = recipients.map((recipient) =>
        this.mailService.sendPaymentConfirmationEmail({
          to: recipient,
          parentName: parent?.fullName || 'Student',
          studentName: student.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: amount,
          paymentMethod: paymentMethod,
          transactionId: transaction.transactionId,
          paymentDate: paymentDate,
          description: invoice.description || 'School fees payment',
        }),
      );

      await Promise.all(emailPromises);

      const recipientList = recipients.join(', ');
      this.logger.log(
        `Payment confirmation email sent successfully for invoice ${invoice.id} to: ${recipientList}`,
      );
    } catch (error) {
      this.logger.error('Error sending payment confirmation email:', error);
      // Don't throw error to avoid breaking the payment flow
      // Just log the error and continue
    }
  }

  async getPaymentStatistics(studentId?: number): Promise<{
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
    totalRefunded: number;
    recentTransactions: PaymentTransaction[];
  }> {
    try {
      const filters = studentId ? { studentId } : {};
      const response = await this.paymentsService.getTransactionsWithFilters({
        ...filters,
        page: 1,
        limit: 1000, // Get all transactions for statistics
      });

      const transactions = response.data;

      const statistics = {
        totalPaid: transactions
          .filter((t) => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
        totalPending: transactions
          .filter((t) => t.status === 'pending' || t.status === 'processing')
          .reduce((sum, t) => sum + t.amount, 0),
        totalFailed: transactions
          .filter((t) => t.status === 'failed')
          .reduce((sum, t) => sum + t.amount, 0),
        totalRefunded: transactions
          .filter((t) => t.status === 'refunded')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        recentTransactions: transactions
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 10),
      };

      return statistics;
    } catch (error) {
      this.logger.error('Error getting payment statistics:', error);
      throw error;
    }
  }
}
