import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeReminderService } from './fee-reminder.service';
import { FeeReminderController } from './fee-reminder.controller';
import { FeeReminderLogEntity } from './infrastructure/persistence/relational/entities/fee-reminder-log.entity';
import { SmsModule } from '../sms/sms.module';
import { MailModule } from '../mail/mail.module';
import { StudentsModule } from '../students/students.module';
import { ParentsModule } from '../parents/parents.module';
import { FeesModule } from '../fees/fees.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeeReminderLogEntity]),
    SmsModule,
    MailModule,
    StudentsModule,
    ParentsModule,
    FeesModule,
    InvoicesModule,
  ],
  providers: [FeeReminderService],
  controllers: [FeeReminderController],
  exports: [FeeReminderService],
})
export class FeeReminderModule {}
