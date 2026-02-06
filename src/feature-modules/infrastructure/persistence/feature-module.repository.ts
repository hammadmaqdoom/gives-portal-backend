import { FeatureModule } from '../../domain/feature-module';

export abstract class FeatureModuleRepository {
  abstract findAll(): Promise<FeatureModule[]>;
  abstract findByName(name: string): Promise<FeatureModule | null>;
  abstract findById(id: number): Promise<FeatureModule | null>;
  abstract findByType(
    moduleType: 'feature' | 'settings_tab',
  ): Promise<FeatureModule[]>;
  abstract update(
    id: number,
    data: Partial<FeatureModule>,
  ): Promise<FeatureModule>;
}
