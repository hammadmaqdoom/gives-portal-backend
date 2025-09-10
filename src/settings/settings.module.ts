import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { RelationalSettingsPersistenceModule } from './infrastructure/persistence/relational/relational-settings-persistence.module';

@Module({
  imports: [RelationalSettingsPersistenceModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
