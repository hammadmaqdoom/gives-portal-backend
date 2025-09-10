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
    const persistenceEntity = SettingsMapper.toPersistence(data as Settings);
    await this.settingsRepository.update(id, persistenceEntity);
    const updatedEntity = await this.settingsRepository.findOne({
      where: { id },
    });
    return SettingsMapper.toDomain(updatedEntity!);
  }
}
