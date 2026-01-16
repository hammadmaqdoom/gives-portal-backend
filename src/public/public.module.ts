import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ClassesModule } from '../classes/classes.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { SettingsModule } from '../settings/settings.module';
import { LearningModulesModule } from '../learning-modules/learning-modules.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [
    ClassesModule,
    InvoicesModule,
    SettingsModule,
    LearningModulesModule,
    CurrencyModule,
  ],
  controllers: [PublicController],
})
export class PublicModule {}
