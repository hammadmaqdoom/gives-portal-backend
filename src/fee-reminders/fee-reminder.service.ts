import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsService } from '../sms/sms.service';
import { WhatsAppService } from '../sms/whatsapp.service';
import { MailService } from '../mail/mail.service';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';
import { FeesService } from '../fees/fees.service';
import { InvoicesService } from '../invoices/invoices.service';
import { FeeReminderLogEntity } from './infrastructure/persistence/relational/entities/fee-reminder-log.entity';

export interface FeeReminderLog {
  id?: number;
  studentId: number;
  parentId?: number;
  invoiceId?: number;
  reminderType: 'email' | 'sms' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed';
  message: string;
  recipient: string;
  sentAt?: Date;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class FeeReminderService {
  private readonly logger = new Logger(FeeReminderService.name);

  constructor(
    @InjectRepository(FeeReminderLogEntity)
    private readonly feeReminderLogRepository: Repository<FeeReminderLogEntity>,
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsAppService,
    private readonly mailService: MailService,
    private readonly studentsService: StudentsService,
    private readonly parentsService: ParentsService,
    private readonly feesService: FeesService,
    private readonly invoicesService: InvoicesService,
  ) {}

  // Run daily at 9 AM to check for overdue fees
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkAndSendFeeReminders() {
    this.logger.log('Starting daily fee reminder check...');
    
    try {
      const overdueInvoices = await this.invoicesService.findOverdue();
      this.logger.log(`Found ${overdueInvoices.length} overdue invoices`);

      for (const invoice of overdueInvoices) {
        await this.sendFeeReminderForInvoice(invoice.id);
      }

      this.logger.log('Fee reminder check completed');
    } catch (error) {
      this.logger.error('Error during fee reminder check:', error);
    }
  }

  // Run weekly on Mondays at 10 AM to send upcoming due date reminders
  @Cron('0 10 * * 1')
  async sendUpcomingDueDateReminders() {
    this.logger.log('Starting weekly upcoming due date reminder check...');
    
    try {
      const upcomingDueDate = new Date();
      upcomingDueDate.setDate(upcomingDueDate.getDate() + 7); // 7 days from now

      // Get invoices due in the next 7 days
      const upcomingInvoices = await this.getInvoicesDueInDays(7);
      this.logger.log(`Found ${upcomingInvoices.length} invoices due in 7 days`);

      for (const invoice of upcomingInvoices) {
        await this.sendUpcomingDueDateReminder(invoice.id);
      }

      this.logger.log('Upcoming due date reminder check completed');
    } catch (error) {
      this.logger.error('Error during upcoming due date reminder check:', error);
    }
  }

  async sendFeeReminderForInvoice(invoiceId: number): Promise<void> {
    try {
      const invoice = await this.invoicesService.findById(invoiceId);
      if (!invoice) {
        this.logger.warn(`Invoice ${invoiceId} not found`);
        return;
      }

      const student = await this.studentsService.findById(invoice.studentId);
      if (!student) {
        this.logger.warn(`Student ${invoice.studentId} not found for invoice ${invoiceId}`);
        return;
      }

      // Get parent information
      let parent: any = null;
      if (invoice.parentId) {
        parent = await this.parentsService.findById(invoice.parentId);
      }

      if (!parent) {
        const parents = await this.parentsService.findByStudentId(invoice.studentId);
        parent = parents && parents.length > 0 ? parents[0] : null;
      }

      if (!parent) {
        this.logger.warn(`No parent found for student ${invoice.studentId}`);
        return;
      }

      // Send email reminder
      if (parent.email) {
        await this.sendEmailReminder(invoice, student, parent);
      }

      // Send SMS reminder
      if (parent.mobile) {
        await this.sendSmsReminder(invoice, student, parent);
      }

      // Send WhatsApp reminder
      if (parent.mobile) {
        await this.sendWhatsAppReminder(invoice, student, parent);
      }

    } catch (error) {
      this.logger.error(`Error sending fee reminder for invoice ${invoiceId}:`, error);
    }
  }

  async sendUpcomingDueDateReminder(invoiceId: number): Promise<void> {
    try {
      const invoice = await this.invoicesService.findById(invoiceId);
      if (!invoice) {
        this.logger.warn(`Invoice ${invoiceId} not found`);
        return;
      }

      const student = await this.studentsService.findById(invoice.studentId);
      if (!student) {
        this.logger.warn(`Student ${invoice.studentId} not found for invoice ${invoiceId}`);
        return;
      }

      // Get parent information
      let parent: any = null;
      if (invoice.parentId) {
        parent = await this.parentsService.findById(invoice.parentId);
      }

      if (!parent) {
        const parents = await this.parentsService.findByStudentId(invoice.studentId);
        parent = parents && parents.length > 0 ? parents[0] : null;
      }

      if (!parent) {
        this.logger.warn(`No parent found for student ${invoice.studentId}`);
        return;
      }

      // Send email reminder
      if (parent.email) {
        await this.sendUpcomingDueDateEmailReminder(invoice, student, parent);
      }

      // Send SMS reminder
      if (parent.mobile) {
        await this.sendUpcomingDueDateSmsReminder(invoice, student, parent);
      }

      // Send WhatsApp reminder
      if (parent.mobile) {
        await this.sendUpcomingDueDateWhatsAppReminder(invoice, student, parent);
      }

    } catch (error) {
      this.logger.error(`Error sending upcoming due date reminder for invoice ${invoiceId}:`, error);
    }
  }

  private async sendEmailReminder(invoice: any, student: any, parent: any): Promise<void> {
    try {
      const reminderMessage = this.generateOverdueFeeReminderMessage(invoice, student, parent);
      
      await this.mailService.sendInvoiceEmail({
        to: parent.email,
        parentName: parent.fullName,
        studentName: student.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: `${invoice.currency} ${invoice.amount.toFixed(2)}`,
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        description: invoice.description,
        pdfBuffer: Buffer.from(''), // Empty buffer for now
      });

      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'email',
        status: 'sent',
        message: reminderMessage,
        recipient: parent.email,
        sentAt: new Date(),
      });

      this.logger.log(`Email reminder sent for invoice ${invoice.invoiceNumber} to ${parent.email}`);
    } catch (error) {
      this.logger.error(`Error sending email reminder for invoice ${invoice.invoiceNumber}:`, error);
      
      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'email',
        status: 'failed',
        message: this.generateOverdueFeeReminderMessage(invoice, student, parent),
        recipient: parent.email,
        errorMessage: error.message,
      });
    }
  }

  private async sendSmsReminder(invoice: any, student: any, parent: any): Promise<void> {
    try {
      const reminderMessage = this.generateOverdueFeeSmsMessage(invoice, student, parent);
      
      const smsResponse = await this.smsService.sendSms({
        to: parent.mobile,
        message: reminderMessage,
      });

      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'sms',
        status: smsResponse.success ? 'sent' : 'failed',
        message: reminderMessage,
        recipient: parent.mobile,
        sentAt: smsResponse.success ? new Date() : undefined,
        errorMessage: smsResponse.error,
      });

      this.logger.log(`SMS reminder ${smsResponse.success ? 'sent' : 'failed'} for invoice ${invoice.invoiceNumber} to ${parent.mobile}`);
    } catch (error) {
      this.logger.error(`Error sending SMS reminder for invoice ${invoice.invoiceNumber}:`, error);
      
      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'sms',
        status: 'failed',
        message: this.generateOverdueFeeSmsMessage(invoice, student, parent),
        recipient: parent.mobile,
        errorMessage: error.message,
      });
    }
  }

  private async sendWhatsAppReminder(invoice: any, student: any, parent: any): Promise<void> {
    try {
      const reminderMessage = this.generateOverdueFeeWhatsAppMessage(invoice, student, parent);
      
      const whatsappResponse = await this.whatsappService.sendWhatsAppMessage({
        to: parent.mobile,
        message: reminderMessage,
        type: 'text',
      });

      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'whatsapp',
        status: whatsappResponse.success ? 'sent' : 'failed',
        message: reminderMessage,
        recipient: parent.mobile,
        sentAt: whatsappResponse.success ? new Date() : undefined,
        errorMessage: whatsappResponse.error,
      });

      this.logger.log(`WhatsApp reminder ${whatsappResponse.success ? 'sent' : 'failed'} for invoice ${invoice.invoiceNumber} to ${parent.mobile}`);
    } catch (error) {
      this.logger.error(`Error sending WhatsApp reminder for invoice ${invoice.invoiceNumber}:`, error);
      
      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'whatsapp',
        status: 'failed',
        message: this.generateOverdueFeeWhatsAppMessage(invoice, student, parent),
        recipient: parent.mobile,
        errorMessage: error.message,
      });
    }
  }

  private async sendUpcomingDueDateEmailReminder(invoice: any, student: any, parent: any): Promise<void> {
    try {
      const reminderMessage = this.generateUpcomingDueDateReminderMessage(invoice, student, parent);
      
      await this.mailService.sendInvoiceEmail({
        to: parent.email,
        parentName: parent.fullName,
        studentName: student.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: `${invoice.currency} ${invoice.amount.toFixed(2)}`,
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        description: invoice.description,
        pdfBuffer: Buffer.from(''), // Empty buffer for now
      });

      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'email',
        status: 'sent',
        message: reminderMessage,
        recipient: parent.email,
        sentAt: new Date(),
      });

      this.logger.log(`Upcoming due date email reminder sent for invoice ${invoice.invoiceNumber} to ${parent.email}`);
    } catch (error) {
      this.logger.error(`Error sending upcoming due date email reminder for invoice ${invoice.invoiceNumber}:`, error);
      
      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'email',
        status: 'failed',
        message: this.generateUpcomingDueDateReminderMessage(invoice, student, parent),
        recipient: parent.email,
        errorMessage: error.message,
      });
    }
  }

  private async sendUpcomingDueDateSmsReminder(invoice: any, student: any, parent: any): Promise<void> {
    try {
      const reminderMessage = this.generateUpcomingDueDateSmsMessage(invoice, student, parent);
      
      const smsResponse = await this.smsService.sendSms({
        to: parent.mobile,
        message: reminderMessage,
      });

      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'sms',
        status: smsResponse.success ? 'sent' : 'failed',
        message: reminderMessage,
        recipient: parent.mobile,
        sentAt: smsResponse.success ? new Date() : undefined,
        errorMessage: smsResponse.error,
      });

      this.logger.log(`Upcoming due date SMS reminder ${smsResponse.success ? 'sent' : 'failed'} for invoice ${invoice.invoiceNumber} to ${parent.mobile}`);
    } catch (error) {
      this.logger.error(`Error sending upcoming due date SMS reminder for invoice ${invoice.invoiceNumber}:`, error);
      
      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'sms',
        status: 'failed',
        message: this.generateUpcomingDueDateSmsMessage(invoice, student, parent),
        recipient: parent.mobile,
        errorMessage: error.message,
      });
    }
  }

  private async sendUpcomingDueDateWhatsAppReminder(invoice: any, student: any, parent: any): Promise<void> {
    try {
      const reminderMessage = this.generateUpcomingDueDateWhatsAppMessage(invoice, student, parent);
      
      const whatsappResponse = await this.whatsappService.sendWhatsAppMessage({
        to: parent.mobile,
        message: reminderMessage,
        type: 'text',
      });

      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'whatsapp',
        status: whatsappResponse.success ? 'sent' : 'failed',
        message: reminderMessage,
        recipient: parent.mobile,
        sentAt: whatsappResponse.success ? new Date() : undefined,
        errorMessage: whatsappResponse.error,
      });

      this.logger.log(`Upcoming due date WhatsApp reminder ${whatsappResponse.success ? 'sent' : 'failed'} for invoice ${invoice.invoiceNumber} to ${parent.mobile}`);
    } catch (error) {
      this.logger.error(`Error sending upcoming due date WhatsApp reminder for invoice ${invoice.invoiceNumber}:`, error);
      
      await this.createReminderLog({
        studentId: student.id,
        parentId: parent.id,
        invoiceId: invoice.id,
        reminderType: 'whatsapp',
        status: 'failed',
        message: this.generateUpcomingDueDateWhatsAppMessage(invoice, student, parent),
        recipient: parent.mobile,
        errorMessage: error.message,
      });
    }
  }

  private generateOverdueFeeReminderMessage(invoice: any, student: any, parent: any): string {
    const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    
    return `Dear ${parent.fullName},

This is a reminder that the fee payment for ${student.name} is overdue.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: ${invoice.currency} ${invoice.amount.toFixed(2)}
- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
- Days Overdue: ${daysOverdue} days
- Description: ${invoice.description}

Please make the payment at your earliest convenience to avoid any late fees or service interruptions.

Thank you for your prompt attention to this matter.

Best regards,
School Administration`;
  }

  private generateOverdueFeeSmsMessage(invoice: any, student: any, parent: any): string {
    const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    
    return `Dear ${parent.fullName}, Fee payment for ${student.name} is overdue by ${daysOverdue} days. Invoice: ${invoice.invoiceNumber}, Amount: ${invoice.currency} ${invoice.amount.toFixed(2)}. Please pay immediately to avoid late fees.`;
  }

  private generateOverdueFeeWhatsAppMessage(invoice: any, student: any, parent: any): string {
    const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    
    return `🔔 *Fee Payment Overdue Reminder*

Dear ${parent.fullName},

The fee payment for *${student.name}* is overdue by *${daysOverdue} days*.

📋 *Invoice Details:*
• Invoice Number: ${invoice.invoiceNumber}
• Amount: *${invoice.currency} ${invoice.amount.toFixed(2)}*
• Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
• Description: ${invoice.description}

⚠️ Please make the payment immediately to avoid late fees or service interruptions.

Thank you for your prompt attention.

Best regards,
School Administration`;
  }

  private generateUpcomingDueDateReminderMessage(invoice: any, student: any, parent: any): string {
    const daysUntilDue = Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return `Dear ${parent.fullName},

This is a friendly reminder that the fee payment for ${student.name} is due soon.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: ${invoice.currency} ${invoice.amount.toFixed(2)}
- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
- Days Until Due: ${daysUntilDue} days
- Description: ${invoice.description}

Please ensure payment is made before the due date to avoid any late fees.

Thank you for your attention to this matter.

Best regards,
School Administration`;
  }

  private generateUpcomingDueDateSmsMessage(invoice: any, student: any, parent: any): string {
    const daysUntilDue = Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return `Dear ${parent.fullName}, Fee payment for ${student.name} is due in ${daysUntilDue} days. Invoice: ${invoice.invoiceNumber}, Amount: ${invoice.currency} ${invoice.amount.toFixed(2)}. Due: ${new Date(invoice.dueDate).toLocaleDateString()}.`;
  }

  private generateUpcomingDueDateWhatsAppMessage(invoice: any, student: any, parent: any): string {
    const daysUntilDue = Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return `📅 *Upcoming Fee Payment Reminder*

Dear ${parent.fullName},

The fee payment for *${student.name}* is due in *${daysUntilDue} days*.

📋 *Invoice Details:*
• Invoice Number: ${invoice.invoiceNumber}
• Amount: *${invoice.currency} ${invoice.amount.toFixed(2)}*
• Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
• Description: ${invoice.description}

💡 Please ensure payment is made before the due date to avoid any late fees.

Thank you for your attention.

Best regards,
School Administration`;
  }

  private async getInvoicesDueInDays(days: number): Promise<any[]> {
    // This would need to be implemented in the invoices service
    // For now, we'll return an empty array
    return [];
  }

  async createReminderLog(logData: Partial<FeeReminderLog>): Promise<FeeReminderLogEntity> {
    const reminderLog = this.feeReminderLogRepository.create({
      studentId: logData.studentId,
      parentId: logData.parentId,
      invoiceId: logData.invoiceId,
      reminderType: logData.reminderType,
      status: logData.status || 'pending',
      message: logData.message,
      recipient: logData.recipient,
      sentAt: logData.sentAt,
      errorMessage: logData.errorMessage,
    });

    return this.feeReminderLogRepository.save(reminderLog);
  }

  async getReminderLogs(limit: number = 50, offset: number = 0): Promise<FeeReminderLogEntity[]> {
    return this.feeReminderLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getReminderLogsByStudent(studentId: number): Promise<FeeReminderLogEntity[]> {
    return this.feeReminderLogRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async getReminderStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    email: number;
    sms: number;
    whatsapp: number;
  }> {
    const logs = await this.feeReminderLogRepository.find();
    
    const stats = {
      total: logs.length,
      sent: 0,
      failed: 0,
      pending: 0,
      email: 0,
      sms: 0,
      whatsapp: 0,
    };

    logs.forEach(log => {
      switch (log.status) {
        case 'sent':
          stats.sent++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'pending':
          stats.pending++;
          break;
      }

      switch (log.reminderType) {
        case 'email':
          stats.email++;
          break;
        case 'sms':
          stats.sms++;
          break;
        case 'whatsapp':
          stats.whatsapp++;
          break;
      }
    });

    return stats;
  }
}
