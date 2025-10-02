import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyRateEntity } from './currency-rate.entity';
import { CurrencyService } from './currency.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CurrencyRateEntity]),
    forwardRef(() => SettingsModule),
  ],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
