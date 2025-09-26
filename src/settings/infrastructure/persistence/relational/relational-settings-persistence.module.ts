import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsEntity } from './entities/settings.entity';
import { SettingsRepositoryImpl } from './repositories/settings.repository';
import { SettingsRepository } from '../settings.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SettingsEntity])],
  providers: [
    {
      provide: SettingsRepository,
      useClass: SettingsRepositoryImpl,
    },
  ],
  exports: [SettingsRepository],
})
export class RelationalSettingsPersistenceModule {}
