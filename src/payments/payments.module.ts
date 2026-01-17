import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentGatewaysController } from './payment-gateways.controller';
import { PaymentTransactionsController } from './payment-transactions.controller';
import { WebhooksController } from './webhooks.controller';
import { PaymentsService } from './payments.service';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { SafepayService } from './gateways/safepay/safepay.service';
import { PayFastService } from './gateways/payfast/payfast.service';
import { AbhiPayService } from './gateways/abhipay/abhipay.service';
import { StripeService } from './gateways/stripe/stripe.service';
import { EncryptionService } from './infrastructure/encryption/encryption.service';
import { WebhookService } from './infrastructure/webhooks/webhook.service';
import { PaymentLoggerService } from './infrastructure/logging/payment-logger.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { StudentsModule } from '../students/students.module';
import { ParentsModule } from '../parents/parents.module';
import { FilesModule } from '../files/files.module';
import { SettingsModule } from '../settings/settings.module';

// Entities
import { PaymentGatewayEntity } from './infrastructure/persistence/relational/entities/payment-gateway.entity';
import { PaymentGatewayCredentialsEntity } from './infrastructure/persistence/relational/entities/payment-gateway-credentials.entity';
import { PaymentTransactionEntity } from './infrastructure/persistence/relational/entities/payment-transaction.entity';

// Repositories
import { PaymentGatewayRepository } from './infrastructure/persistence/payment-gateway.repository';
import { PaymentGatewayCredentialsRepository } from './infrastructure/persistence/payment-gateway-credentials.repository';
import { PaymentTransactionRepository } from './infrastructure/persistence/payment-transaction.repository';
import { PaymentGatewayRepositoryImpl } from './infrastructure/persistence/relational/repositories/payment-gateway.repository';
import { PaymentGatewayCredentialsRepositoryImpl } from './infrastructure/persistence/relational/repositories/payment-gateway-credentials.repository';
import { PaymentTransactionRepositoryImpl } from './infrastructure/persistence/relational/repositories/payment-transaction.repository';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      PaymentGatewayEntity,
      PaymentGatewayCredentialsEntity,
      PaymentTransactionEntity,
    ]),
    forwardRef(() => InvoicesModule),
    forwardRef(() => StudentsModule),
    forwardRef(() => ParentsModule),
    FilesModule,
    SettingsModule,
  ],
  controllers: [
    PaymentGatewaysController,
    PaymentTransactionsController,
    WebhooksController,
  ],
  providers: [
    PaymentsService,
    PaymentGatewayFactory,
    SafepayService,
    PayFastService,
    AbhiPayService,
    StripeService,
    EncryptionService,
    WebhookService,
    PaymentLoggerService,
    {
      provide: PaymentGatewayRepository,
      useClass: PaymentGatewayRepositoryImpl,
    },
    {
      provide: PaymentGatewayCredentialsRepository,
      useClass: PaymentGatewayCredentialsRepositoryImpl,
    },
    {
      provide: PaymentTransactionRepository,
      useClass: PaymentTransactionRepositoryImpl,
    },
  ],
  exports: [
    PaymentsService,
    PaymentGatewayFactory,
    PaymentGatewayRepository,
    PaymentGatewayCredentialsRepository,
    PaymentTransactionRepository,
  ],
})
export class PaymentsModule {}
