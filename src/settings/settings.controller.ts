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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { SettingsService } from './settings.service';
import { CreateSettingsDto } from './dto/create-settings.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Settings } from './domain/settings';

@ApiTags('Settings')
@Controller({
  path: 'settings',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(RoleEnum.admin)
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
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get app configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App configuration retrieved successfully',
  })
  async getAppConfig() {
    return this.settingsService.getAppConfig();
  }

  @Get('business-info')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get business information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business information retrieved successfully',
  })
  async getBusinessInfo() {
    return this.settingsService.getBusinessInfo();
  }

  @Get('bank-details')
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Get bank account details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank details retrieved successfully',
  })
  async getBankDetails() {
    return this.settingsService.getBankDetails();
  }

  @Get('smtp-config')
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Get SMTP configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMTP configuration retrieved successfully',
  })
  async getSmtpConfig() {
    return this.settingsService.getSmtpConfig();
  }

  @Get('social-media')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get social media links' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Social media links retrieved successfully',
  })
  async getSocialMedia() {
    return this.settingsService.getSocialMedia();
  }

  @Post()
  @Roles(RoleEnum.admin)
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
  @Roles(RoleEnum.admin)
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
