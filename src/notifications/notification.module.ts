import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [MailerModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
