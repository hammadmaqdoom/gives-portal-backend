import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { RelationalSettingsPersistenceModule } from './infrastructure/persistence/relational/relational-settings-persistence.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [
    RelationalSettingsPersistenceModule,
    forwardRef(() => CurrencyModule),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
