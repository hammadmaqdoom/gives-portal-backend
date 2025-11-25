import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';

import { MaybeType } from '../utils/types/maybe.type';
import { MailerService } from '../mailer/mailer.service';
import { createUrl } from '../utils/url-helper';
import path from 'path';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-email.text1'),
        i18n.t('confirm-email.text2'),
        i18n.t('confirm-email.text3'),
      ]);
    }

    const frontendDomain = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });

    const url = createUrl(frontendDomain, '/confirm-email');
    url.searchParams.set('hash', mailData.data.hash);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'activation.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('app.name', { infer: true }),
        text1,
        text2,
        text3,
      },
    });
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let resetPasswordTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.resetPassword'),
        i18n.t('reset-password.text1'),
        i18n.t('reset-password.text2'),
        i18n.t('reset-password.text3'),
        i18n.t('reset-password.text4'),
      ]);
    }

    const frontendDomain = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });

    const url = createUrl(frontendDomain, '/password-change');
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle,
      text: `${url.toString()} ${resetPasswordTitle}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'reset-password.hbs',
      ),
      context: {
        title: resetPasswordTitle,
        url: url.toString(),
        actionTitle: resetPasswordTitle,
        app_name: this.configService.get('app.name', {
          infer: true,
        }),
        text1,
        text2,
        text3,
        text4,
      },
    });
  }

  async confirmNewEmail(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-new-email.text1'),
        i18n.t('confirm-new-email.text2'),
        i18n.t('confirm-new-email.text3'),
      ]);
    }

    const frontendDomain = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });

    const url = createUrl(frontendDomain, '/confirm-new-email');
    url.searchParams.set('hash', mailData.data.hash);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'confirm-new-email.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('app.name', { infer: true }),
        text1,
        text2,
        text3,
      },
    });
  }

  async sendInvoiceEmail(data: {
    to: string;
    parentName: string;
    studentName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    description: string;
    pdfBuffer: Buffer;
  }): Promise<void> {
    const i18n = I18nContext.current();
    let emailTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.invoiceEmail'),
        i18n.t('invoice-email.text1'),
        i18n.t('invoice-email.text2'),
        i18n.t('invoice-email.text3'),
      ]);
    }

    await this.mailerService.sendMail({
      to: data.to,
      subject:
        emailTitle || `Invoice ${data.invoiceNumber} - ${data.studentName}`,
      text: `Invoice ${data.invoiceNumber} for ${data.studentName}. Amount: ${data.amount}. Due: ${data.dueDate}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'invoice-email.hbs',
      ),
      context: {
        title: emailTitle || `Invoice ${data.invoiceNumber}`,
        parentName: data.parentName,
        studentName: data.studentName,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        dueDate: data.dueDate,
        description: data.description,
        app_name: this.configService.get('app.name', { infer: true }),
        text1: text1 || `Dear ${data.parentName || 'Student'},`,
        text2:
          text2 || `Please find attached the invoice for ${data.studentName}.`,
        text3: text3 || `Amount: ${data.amount} | Due Date: ${data.dueDate}`,
      },
      attachments: [
        {
          filename: `invoice-${data.invoiceNumber}.pdf`,
          content: data.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  async sendPaymentConfirmationEmail(data: {
    to: string;
    parentName: string;
    studentName: string;
    invoiceNumber: string;
    amount: string;
    paymentMethod: string;
    transactionId: string;
    paymentDate: string;
    description: string;
  }): Promise<void> {
    const i18n = I18nContext.current();
    let emailTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.paymentConfirmationEmail'),
        i18n.t('payment-confirmation-email.text1'),
        i18n.t('payment-confirmation-email.text2'),
        i18n.t('payment-confirmation-email.text3'),
      ]);
    }

    await this.mailerService.sendMail({
      to: data.to,
      subject:
        emailTitle || `Payment Confirmation - Invoice ${data.invoiceNumber}`,
      text: `Payment confirmed for Invoice ${data.invoiceNumber}. Amount: ${data.amount}. Transaction ID: ${data.transactionId}`,
      templatePath: path.join(
        this.configService.getOrThrow('app.workingDirectory', {
          infer: true,
        }),
        'src',
        'mail',
        'mail-templates',
        'payment-confirmation.hbs',
      ),
      context: {
        title:
          emailTitle || `Payment Confirmation - Invoice ${data.invoiceNumber}`,
        parentName: data.parentName,
        studentName: data.studentName,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        paymentDate: data.paymentDate,
        description: data.description,
        app_name: this.configService.get('app.name', { infer: true }),
        text1: text1 || `Dear ${data.parentName || 'Student'},`,
        text2:
          text2 ||
          `We are pleased to confirm that your payment has been processed successfully.`,
        text3: text3 || `Thank you for your prompt payment!`,
      },
    });
  }
}
