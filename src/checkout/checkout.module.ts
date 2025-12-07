import { Module, forwardRef } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CartModule } from '../cart/cart.module';
import { StudentsModule } from '../students/students.module';
import { ParentsModule } from '../parents/parents.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ClassesModule } from '../classes/classes.module';
import { CurrencyModule } from '../currency/currency.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    CartModule,
    forwardRef(() => StudentsModule),
    forwardRef(() => ParentsModule),
    InvoicesModule,
    ClassesModule,
    CurrencyModule,
    NotificationModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}

