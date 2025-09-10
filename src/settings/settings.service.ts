import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { SettingsRepository } from './infrastructure/persistence/settings.repository';
import { Settings } from './domain/settings';
import { CreateSettingsDto } from './dto/create-settings.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async getSettings(): Promise<Settings | null> {
    return this.settingsRepository.find();
  }

  async getSettingsOrCreate(): Promise<Settings> {
    let settings = await this.settingsRepository.find();
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings: CreateSettingsDto = {
        appName: 'LMS Portal',
        appTitle: 'LMS Portal - Education Management System',
        metaDescription: 'Comprehensive education management system for schools and institutions',
        defaultTimezone: 'Asia/Karachi',
        smtpSecure: false,
        smtpIgnoreTls: false,
        smtpRequireTls: true,
      };
      
      settings = await this.settingsRepository.create(defaultSettings);
    }
    
    return settings;
  }

  async createSettings(createSettingsDto: CreateSettingsDto): Promise<Settings> {
    // Check if settings already exist
    const existingSettings = await this.settingsRepository.find();
    if (existingSettings) {
      throw new Error('Settings already exist. Use update instead.');
    }

    return this.settingsRepository.create(createSettingsDto);
  }

  async updateSettings(updateSettingsDto: UpdateSettingsDto): Promise<Settings> {
    const existingSettings = await this.settingsRepository.find();
    
    if (!existingSettings) {
      throw new NotFoundException('Settings not found');
    }

    const updatedSettings = await this.settingsRepository.update(existingSettings.id, updateSettingsDto);
    
    // If SMTP settings were updated, we could emit an event here
    // to notify the mailer service to refresh its configuration
    // For now, the mailer service will use the latest config on each send
    
    return updatedSettings;
  }

  async getAppConfig(): Promise<{
    appName: string;
    appTitle: string;
    metaDescription: string;
    logoNavbar?: string | null;
    logoFavicon?: string | null;
    defaultTimezone: string;
  }> {
    const settings = await this.getSettingsOrCreate();
    
    return {
      appName: settings.appName,
      appTitle: settings.appTitle,
      metaDescription: settings.metaDescription,
      logoNavbar: settings.logoNavbar,
      logoFavicon: settings.logoFavicon,
      defaultTimezone: settings.defaultTimezone,
    };
  }

  async getBusinessInfo(): Promise<{
    businessAddress?: string | null;
    taxRegistrationLabel?: string | null;
    taxRegistrationNumber?: string | null;
    companyNumber?: string | null;
    companyLegalName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    contactWebsite?: string | null;
  }> {
    const settings = await this.getSettingsOrCreate();
    
    return {
      businessAddress: settings.businessAddress,
      taxRegistrationLabel: settings.taxRegistrationLabel,
      taxRegistrationNumber: settings.taxRegistrationNumber,
      companyNumber: settings.companyNumber,
      companyLegalName: settings.companyLegalName,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      contactWebsite: settings.contactWebsite,
    };
  }

  async getBankDetails(): Promise<{
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountTitle?: string | null;
    bankAccountType?: string | null;
    bankAccountCurrency?: string | null;
    bankRoutingNumber?: string | null;
    bankIban?: string | null;
    bankSwiftCode?: string | null;
  }> {
    const settings = await this.getSettingsOrCreate();
    
    return {
      bankName: settings.bankName,
      bankAccountNumber: settings.bankAccountNumber,
      bankAccountTitle: settings.bankAccountTitle,
      bankAccountType: settings.bankAccountType,
      bankAccountCurrency: settings.bankAccountCurrency,
      bankRoutingNumber: settings.bankRoutingNumber,
      bankIban: settings.bankIban,
      bankSwiftCode: settings.bankSwiftCode,
    };
  }

  async getSmtpConfig(): Promise<{
    smtpHost?: string | null;
    smtpPort?: number | null;
    smtpUser?: string | null;
    smtpPassword?: string | null;
    smtpFromEmail?: string | null;
    smtpFromName?: string | null;
    smtpSecure: boolean;
    smtpIgnoreTls: boolean;
    smtpRequireTls: boolean;
  }> {
    const settings = await this.getSettingsOrCreate();
    
    return {
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpPassword: settings.smtpPassword,
      smtpFromEmail: settings.smtpFromEmail,
      smtpFromName: settings.smtpFromName,
      smtpSecure: settings.smtpSecure,
      smtpIgnoreTls: settings.smtpIgnoreTls,
      smtpRequireTls: settings.smtpRequireTls,
    };
  }

  async getSocialMedia(): Promise<{
    socialFacebook?: string | null;
    socialTwitter?: string | null;
    socialLinkedin?: string | null;
    socialInstagram?: string | null;
  }> {
    const settings = await this.getSettingsOrCreate();
    
    return {
      socialFacebook: settings.socialFacebook,
      socialTwitter: settings.socialTwitter,
      socialLinkedin: settings.socialLinkedin,
      socialInstagram: settings.socialInstagram,
    };
  }
}
