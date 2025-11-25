import { Module, forwardRef } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { InvoicePaymentService } from './invoice-payment.service';
import { InvoicePaymentController } from './invoice-payment.controller';
import { RelationalInvoicePersistenceModule } from './infrastructure/persistence/relational/relational-invoice-persistence.module';
import { StudentsModule } from '../students/students.module';
import { ParentsModule } from '../parents/parents.module';
import { NotificationModule } from '../notifications/notification.module';
import { MailModule } from '../mail/mail.module';
import { PaymentsModule } from '../payments/payments.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    RelationalInvoicePersistenceModule,
    NotificationModule,
    MailModule,
    SettingsModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => StudentsModule),
    forwardRef(() => ParentsModule),
  ],
  controllers: [InvoicesController, InvoicePaymentController],
  providers: [InvoicesService, InvoicePaymentService],
  exports: [InvoicesService, InvoicePaymentService],
})
export class InvoicesModule {}
