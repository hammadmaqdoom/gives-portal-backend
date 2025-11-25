import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceGenerationService } from './invoice-generation.service';
import { InvoiceGenerationController } from './invoice-generation.controller';
import { InvoiceGenerationLogEntity } from './infrastructure/persistence/relational/entities/invoice-generation-log.entity';
import { StudentsModule } from '../students/students.module';
import { ClassesModule } from '../classes/classes.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { FeesModule } from '../fees/fees.module';
import { ParentsModule } from '../parents/parents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceGenerationLogEntity]),
    StudentsModule,
    ClassesModule,
    InvoicesModule,
    FeesModule,
    ParentsModule,
  ],
  providers: [InvoiceGenerationService],
  controllers: [InvoiceGenerationController],
  exports: [InvoiceGenerationService],
})
export class InvoiceGenerationModule {}
