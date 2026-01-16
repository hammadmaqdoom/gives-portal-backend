import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { RelationalFeePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ParentsModule } from '../parents/parents.module';
import { StudentsModule } from '../students/students.module';
import { InvoiceEntity } from '../invoices/infrastructure/persistence/relational/entities/invoice.entity';

const infrastructurePersistenceModule = RelationalFeePersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    forwardRef(() => ParentsModule),
    forwardRef(() => StudentsModule),
    TypeOrmModule.forFeature([InvoiceEntity]),
  ],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService, infrastructurePersistenceModule],
})
export class FeesModule {}
