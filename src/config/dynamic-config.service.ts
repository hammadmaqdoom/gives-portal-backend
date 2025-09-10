import { Injectable, OnModuleInit } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class DynamicConfigService implements OnModuleInit {
  private appConfig: any = {};
  private smtpConfig: any = {};

  constructor(private readonly settingsService: SettingsService) {}

  async onModuleInit() {
    await this.loadConfigurations();
  }

  async loadConfigurations() {
    try {
      this.appConfig = await this.settingsService.getAppConfig();
      this.smtpConfig = await this.settingsService.getSmtpConfig();
    } catch (error) {
      console.error('Error loading dynamic configurations:', error);
      // Fallback to default values
      this.appConfig = {
        appName: 'LMS Portal',
        appTitle: 'LMS Portal - Education Management System',
        metaDescription: 'Comprehensive education management system',
        defaultTimezone: 'Asia/Karachi',
      };
    }
  }

  getAppConfig() {
    return this.appConfig;
  }

  getSmtpConfig() {
    return this.smtpConfig;
  }

  async refreshConfigurations() {
    await this.loadConfigurations();
  }
}
