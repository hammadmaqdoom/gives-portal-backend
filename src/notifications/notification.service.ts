import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '../mailer/mailer.service';
import { AllConfigType } from '../config/config.type';
import * as path from 'path';

export interface NotificationData {
  to: string;
  subject?: string;
  [key: string]: any;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  private getTemplatePath(templateName: string): string {
    return path.join(
      this.configService.getOrThrow('app.workingDirectory', { infer: true }),
      'src',
      'mail',
      'mail-templates',
      `${templateName}.hbs`,
    );
  }

  private getAppName(): string {
    return this.configService.get('app.name', { infer: true }) || 'Gives Portal';
  }

  private getFrontendUrl(): string {
    return this.configService.getOrThrow('app.frontendDomain', { infer: true });
  }

  async sendWelcomeEmail(data: NotificationData & {
    userName: string;
  }): Promise<void> {
    const loginUrl = `${this.getFrontendUrl()}/auth/login`;
    
    await this.mailerService.sendMail({
      to: data.to,
      subject: `Welcome to ${this.getAppName()}`,
      templatePath: this.getTemplatePath('welcome'),
      context: {
        app_name: this.getAppName(),
        userName: data.userName,
        loginUrl,
      },
    });
  }

  async sendClassEnrollmentNotification(data: NotificationData & {
    parentName: string;
    studentName: string;
    className: string;
    subjectName: string;
    teacherName: string;
    schedule: string;
    fee: string;
  }): Promise<void> {
    const dashboardUrl = `${this.getFrontendUrl()}/dashboard`;
    
    await this.mailerService.sendMail({
      to: data.to,
      subject: `Class Enrollment Confirmation - ${data.className}`,
      templatePath: this.getTemplatePath('class-enrollment'),
      context: {
        app_name: this.getAppName(),
        parentName: data.parentName,
        studentName: data.studentName,
        className: data.className,
        subjectName: data.subjectName,
        teacherName: data.teacherName,
        schedule: data.schedule,
        fee: data.fee,
        dashboardUrl,
      },
    });
  }

  async sendClassUnenrollmentNotification(data: NotificationData & {
    parentName: string;
    studentName: string;
    className: string;
    subjectName: string;
    teacherName: string;
    reason: string;
  }): Promise<void> {
    const dashboardUrl = `${this.getFrontendUrl()}/dashboard`;
    
    await this.mailerService.sendMail({
      to: data.to,
      subject: `Class Unenrollment Notification - ${data.className}`,
      templatePath: this.getTemplatePath('class-unenrollment'),
      context: {
        app_name: this.getAppName(),
        parentName: data.parentName,
        studentName: data.studentName,
        className: data.className,
        subjectName: data.subjectName,
        teacherName: data.teacherName,
        reason: data.reason,
        dashboardUrl,
      },
    });
  }

  async sendInvoiceGeneratedNotification(data: NotificationData & {
    parentName: string;
    studentName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    description: string;
    invoiceId: number;
  }): Promise<void> {
    const invoiceUrl = `${this.getFrontendUrl()}/dashboard/invoices/${data.invoiceId}`;
    
    await this.mailerService.sendMail({
      to: data.to,
      subject: `New Invoice Generated - ${data.invoiceNumber}`,
      templatePath: this.getTemplatePath('invoice-generated'),
      context: {
        app_name: this.getAppName(),
        parentName: data.parentName,
        studentName: data.studentName,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        dueDate: data.dueDate,
        description: data.description,
        invoiceUrl,
      },
    });
  }

  async sendAnnouncementNotification(data: NotificationData & {
    recipientName: string;
    title: string;
    message: string;
    authorName: string;
    postDate: string;
  }): Promise<void> {
    const dashboardUrl = `${this.getFrontendUrl()}/dashboard`;
    
    await this.mailerService.sendMail({
      to: data.to,
      subject: `New Announcement: ${data.title}`,
      templatePath: this.getTemplatePath('announcement'),
      context: {
        app_name: this.getAppName(),
        recipientName: data.recipientName,
        title: data.title,
        message: data.message,
        authorName: data.authorName,
        postDate: data.postDate,
        dashboardUrl,
      },
    });
  }

  async sendPasswordResetNotification(data: NotificationData & {
    userName: string;
    resetUrl: string;
  }): Promise<void> {
    await this.mailerService.sendMail({
      to: data.to,
      subject: `Password Reset - ${this.getAppName()}`,
      templatePath: this.getTemplatePath('reset-password'),
      context: {
        app_name: this.getAppName(),
        userName: data.userName,
        url: data.resetUrl,
        title: 'Reset Your Password',
        actionTitle: 'Reset Password',
        text1: 'You requested to reset your password.',
        text2: 'Click the button below to reset your password:',
        text3: 'If you did not request this, please ignore this email.',
        text4: 'This link will expire in 24 hours for security reasons.',
      },
    });
  }
}
