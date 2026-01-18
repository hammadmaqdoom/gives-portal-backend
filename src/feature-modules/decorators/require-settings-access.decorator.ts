import { SetMetadata } from '@nestjs/common';

export const SETTINGS_ACCESS_KEY = 'settings_access';
export const RequireSettingsAccess = (moduleKey: string) =>
  SetMetadata(SETTINGS_ACCESS_KEY, moduleKey);
