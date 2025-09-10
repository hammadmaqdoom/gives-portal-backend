import { Module, forwardRef } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { RelationalInvoicePersistenceModule } from './infrastructure/persistence/relational/relational-invoice-persistence.module';
import { StudentsModule } from '../students/students.module';
import { ParentsModule } from '../parents/parents.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    RelationalInvoicePersistenceModule,
    NotificationModule,
    forwardRef(() => StudentsModule),
    forwardRef(() => ParentsModule),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
