import { Injectable, NotFoundException } from '@nestjs/common';
import { FeatureModuleRepository } from './infrastructure/persistence/feature-module.repository';
import { FeatureModule } from './domain/feature-module';
import { UpdateFeatureModuleDto } from './dto/update-feature-module.dto';

@Injectable()
export class FeatureModulesService {
  constructor(
    private readonly featureModuleRepository: FeatureModuleRepository,
  ) {}

  async findAll(): Promise<FeatureModule[]> {
    return this.featureModuleRepository.findAll();
  }

  async findByType(
    moduleType: 'feature' | 'settings_tab',
  ): Promise<FeatureModule[]> {
    return this.featureModuleRepository.findByType(moduleType);
  }

  async findByName(name: string): Promise<FeatureModule | null> {
    return this.featureModuleRepository.findByName(name);
  }

  async findById(id: number): Promise<FeatureModule> {
    const module = await this.featureModuleRepository.findById(id);
    if (!module) {
      throw new NotFoundException(`Feature module with id ${id} not found`);
    }
    return module;
  }

  async update(
    id: number,
    updateDto: UpdateFeatureModuleDto,
  ): Promise<FeatureModule> {
    const module = await this.featureModuleRepository.findById(id);
    if (!module) {
      throw new NotFoundException(`Feature module with id ${id} not found`);
    }

    return this.featureModuleRepository.update(id, updateDto);
  }

  async isModuleEnabled(name: string): Promise<boolean> {
    const module = await this.featureModuleRepository.findByName(name);
    return module?.isEnabled ?? false;
  }
}
