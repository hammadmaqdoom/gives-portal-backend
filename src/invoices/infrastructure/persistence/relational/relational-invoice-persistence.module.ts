import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceItemEntity } from './entities/invoice-item.entity';
import { InvoiceRepositoryImpl } from './repositories/invoice.repository';
import { InvoiceRepository } from '../invoice.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceEntity, InvoiceItemEntity])],
  providers: [InvoiceRepositoryImpl],
  exports: [InvoiceRepositoryImpl],
})
export class RelationalInvoicePersistenceModule {}
