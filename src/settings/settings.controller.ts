import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { SettingsService } from './settings.service';
import { CurrencyService } from '../currency/currency.service';
import { CreateSettingsDto } from './dto/create-settings.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Settings } from './domain/settings';
import { RequireSettingsAccess } from '../feature-modules/decorators/require-settings-access.decorator';
import { SettingsAccessGuard } from '../feature-modules/guards/settings-access.guard';

@ApiTags('Settings')
@Controller({
  path: 'settings',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard, SettingsAccessGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly currencyService: CurrencyService,
  ) {}

  @Get()
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @ApiOperation({ summary: 'Get application settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: Settings,
  })
  async getSettings(): Promise<Settings | null> {
    return this.settingsService.getSettings();
  }

  @Get('app-config')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @RequireSettingsAccess('app_config')
  @ApiOperation({ summary: 'Get app configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App configuration retrieved successfully',
  })
  async getAppConfig() {
    return this.settingsService.getAppConfig();
  }

  @Get('business-info')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @RequireSettingsAccess('business_info')
  @ApiOperation({ summary: 'Get business information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business information retrieved successfully',
  })
  async getBusinessInfo() {
    return this.settingsService.getBusinessInfo();
  }

  @Get('bank-details')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @RequireSettingsAccess('bank_details')
  @ApiOperation({ summary: 'Get bank account details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank details retrieved successfully',
  })
  async getBankDetails() {
    return this.settingsService.getBankDetails();
  }

  @Get('smtp-config')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('smtp_config')
  @ApiOperation({ summary: 'Get SMTP configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMTP configuration retrieved successfully',
  })
  async getSmtpConfig() {
    return this.settingsService.getSmtpConfig();
  }

  @Get('social-media')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @RequireSettingsAccess('social_media')
  @ApiOperation({ summary: 'Get social media links' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Social media links retrieved successfully',
  })
  async getSocialMedia() {
    return this.settingsService.getSocialMedia();
  }

  @Get('file-storage')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('file_storage')
  @ApiOperation({ summary: 'Get file storage configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File storage configuration retrieved successfully',
  })
  async getFileStorage() {
    return this.settingsService.getFileStorage();
  }

  @Get('sms-config')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('sms_config')
  @ApiOperation({ summary: 'Get SMS and WhatsApp configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMS configuration retrieved successfully',
  })
  async getSmsConfig() {
    const settings = await this.settingsService.getSettingsOrCreate();
    return {
      smsEnabled: (settings as any).smsEnabled ?? false,
      smsProvider: (settings as any).smsProvider ?? null,
      smsApiEmail: (settings as any).smsApiEmail ?? null,
      smsApiKey: (settings as any).smsApiKey ?? null,
      smsMask: (settings as any).smsMask ?? null,
      smsApiUrl: (settings as any).smsApiUrl ?? null,
      smsTestMode: (settings as any).smsTestMode ?? true,
      whatsappEnabled: (settings as any).whatsappEnabled ?? false,
      whatsappDeviceId: (settings as any).whatsappDeviceId ?? null,
      whatsappApiUrl: (settings as any).whatsappApiUrl ?? null,
    };
  }

  @Get('theme-config')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('theme')
  @ApiOperation({ summary: 'Get theme configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Theme configuration retrieved successfully',
  })
  async getThemeConfig() {
    return this.settingsService.getThemeConfig();
  }

  @Get('content-protection')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @RequireSettingsAccess('content_protection')
  @ApiOperation({ summary: 'Get content protection and watermark configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content protection configuration retrieved successfully',
  })
  async getContentProtection() {
    return this.settingsService.getContentProtection();
  }

  @Post('currency/sync')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @ApiOperation({ summary: 'Manually sync currency rates (fetch latest)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Currency rates synced' })
  async syncCurrencyRates() {
    const record = await this.currencyService.getRateForDate(new Date());
    return { success: true, base: record.base, date: record.date };
  }

  @Post()
  @Roles(RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Create application settings' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Settings created successfully',
    type: Settings,
  })
  async createSettings(
    @Body() createSettingsDto: CreateSettingsDto,
    @Request() req: any,
  ): Promise<Settings> {
    return this.settingsService.createSettings(createSettingsDto);
  }

  @Patch()
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @ApiOperation({ summary: 'Update application settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
    type: Settings,
  })
  async updateSettings(
    @Body() updateSettingsDto: UpdateSettingsDto,
    @Request() req: any,
  ): Promise<Settings> {
    return this.settingsService.updateSettings(updateSettingsDto);
  }
}
