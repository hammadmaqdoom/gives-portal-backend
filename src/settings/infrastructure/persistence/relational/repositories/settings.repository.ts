import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsRepository } from '../../settings.repository';
import { Settings } from '../../../../domain/settings';
import { SettingsEntity } from '../entities/settings.entity';
import { SettingsMapper } from '../mappers/settings.mapper';

@Injectable()
export class SettingsRepositoryImpl implements SettingsRepository {
  constructor(
    @InjectRepository(SettingsEntity)
    private readonly settingsRepository: Repository<SettingsEntity>,
  ) {}

  async find(): Promise<Settings | null> {
    const settings = await this.settingsRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    return settings ? SettingsMapper.toDomain(settings) : null;
  }

  async create(data: Partial<Settings>): Promise<Settings> {
    const persistenceEntity = SettingsMapper.toPersistence(data as Settings);
    const newEntity = await this.settingsRepository.save(
      this.settingsRepository.create(persistenceEntity),
    );
    return SettingsMapper.toDomain(newEntity);
  }

  async update(id: number, data: Partial<Settings>): Promise<Settings> {
    // Load current entity and perform a safe partial merge of only defined keys
    const current = await this.settingsRepository.findOne({ where: { id } });
    if (!current) {
      throw new Error('Settings not found');
    }

    // Copy only defined values from incoming partial to avoid nulling other fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        // @ts-ignore dynamic assign
        (current as any)[key] = value as any;
      }
    });

    const saved = await this.settingsRepository.save(current);
    return SettingsMapper.toDomain(saved);
  }
}
