
import { Module, forwardRef } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [forwardRef(() => SettingsModule)],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
