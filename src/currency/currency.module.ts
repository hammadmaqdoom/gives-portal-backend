import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyRateEntity } from './currency-rate.entity';
import { CurrencyService } from './currency.service';
import { CurrencyInterceptor } from './currency.interceptor';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CurrencyRateEntity]),
    forwardRef(() => SettingsModule),
  ],
  providers: [CurrencyService, CurrencyInterceptor],
  exports: [CurrencyService, CurrencyInterceptor],
})
export class CurrencyModule {}
