import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureModuleEntity } from './entities/feature-module.entity';
import { FeatureModuleRepository } from '../feature-module.repository';
import { FeatureModuleRepositoryImpl } from './repositories/feature-module.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureModuleEntity])],
  providers: [
    {
      provide: FeatureModuleRepository,
      useClass: FeatureModuleRepositoryImpl,
    },
  ],
  exports: [FeatureModuleRepository],
})
export class RelationalFeatureModulePersistenceModule {}
