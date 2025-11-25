import { Settings } from '../../domain/settings';

export abstract class SettingsRepository {
  abstract find(): Promise<Settings | null>;
  abstract create(data: Partial<Settings>): Promise<Settings>;
  abstract update(id: number, data: Partial<Settings>): Promise<Settings>;
}
