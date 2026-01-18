import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { RelationalSettingsPersistenceModule } from './infrastructure/persistence/relational/relational-settings-persistence.module';
import { CurrencyModule } from '../currency/currency.module';
import { FeatureModulesModule } from '../feature-modules/feature-modules.module';

@Module({
  imports: [
    RelationalSettingsPersistenceModule,
    forwardRef(() => CurrencyModule),
    FeatureModulesModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
