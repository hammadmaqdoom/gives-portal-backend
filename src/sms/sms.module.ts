import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsService } from './sms.service';
import { WhatsAppService } from './whatsapp.service';
import { SmsController } from './sms.controller';
import { SmsLogEntity } from './infrastructure/persistence/relational/entities/sms-log.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsLogEntity]),
    SettingsModule,
  ],
  providers: [SmsService, WhatsAppService],
  controllers: [SmsController],
  exports: [SmsService, WhatsAppService],
})
export class SmsModule {}
