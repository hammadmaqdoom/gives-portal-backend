import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureModuleRepository } from '../../feature-module.repository';
import { FeatureModule } from '../../../../domain/feature-module';
import { FeatureModuleEntity } from '../entities/feature-module.entity';

@Injectable()
export class FeatureModuleRepositoryImpl
  implements FeatureModuleRepository
{
  constructor(
    @InjectRepository(FeatureModuleEntity)
    private readonly featureModuleRepository: Repository<FeatureModuleEntity>,
  ) {}

  async findAll(): Promise<FeatureModule[]> {
    const entities = await this.featureModuleRepository.find({
      order: { sortOrder: 'ASC', category: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByName(name: string): Promise<FeatureModule | null> {
    const entity = await this.featureModuleRepository.findOne({
      where: { name },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: number): Promise<FeatureModule | null> {
    const entity = await this.featureModuleRepository.findOne({
      where: { id },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByType(
    moduleType: 'feature' | 'settings_tab',
  ): Promise<FeatureModule[]> {
    const entities = await this.featureModuleRepository.find({
      where: { moduleType },
      order: { sortOrder: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async update(
    id: number,
    data: Partial<FeatureModule>,
  ): Promise<FeatureModule> {
    const entity = await this.featureModuleRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Feature module not found');
    }

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        // Map domain property names to entity property names
        const entityKey =
          key === 'displayName'
            ? 'displayName'
            : key === 'isEnabled'
              ? 'isEnabled'
              : key === 'moduleType'
                ? 'moduleType'
                : key;
        (entity as any)[entityKey] = value;
      }
    });

    const saved = await this.featureModuleRepository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: FeatureModuleEntity): FeatureModule {
    return {
      id: entity.id,
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description,
      isEnabled: entity.isEnabled,
      icon: entity.icon,
      category: entity.category,
      moduleType: entity.moduleType,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
