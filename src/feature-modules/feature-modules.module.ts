import { Module } from '@nestjs/common';
import { FeatureModulesController } from './feature-modules.controller';
import { FeatureModulesService } from './feature-modules.service';
import { RelationalFeatureModulePersistenceModule } from './infrastructure/persistence/relational/relational-feature-module-persistence.module';
import { SettingsAccessGuard } from './guards/settings-access.guard';

@Module({
  imports: [RelationalFeatureModulePersistenceModule],
  controllers: [FeatureModulesController],
  providers: [FeatureModulesService, SettingsAccessGuard],
  exports: [FeatureModulesService, SettingsAccessGuard],
})
export class FeatureModulesModule {}
