import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { Roles } from '../roles/roles.decorator';
import { SmsService, SmsMessage } from './sms.service';
import { WhatsAppService, WhatsAppMessage } from './whatsapp.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('SMS')
@Controller({
  path: 'sms',
  version: '1',
})
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  @Post('send')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMS sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid SMS data or SMS service not configured',
  })
  async sendSms(@Body() smsMessage: SmsMessage) {
    return this.smsService.sendSms(smsMessage);
  }

  @Post('send-bulk')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk SMS sent successfully',
  })
  async sendBulkSms(@Body() messages: SmsMessage[]) {
    return this.smsService.sendBulkSms(messages);
  }

  @Get('status')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiQuery({ name: 'messageId', required: true, description: 'SMS message ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMS status retrieved successfully',
  })
  async checkSmsStatus(@Query('messageId') messageId: string) {
    return this.smsService.checkSmsStatus(messageId);
  }

  @Get('balance')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMS balance retrieved successfully',
  })
  async getSmsBalance() {
    return this.smsService.getSmsBalance();
  }

  @Get('logs')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiQuery({ name: 'limit', required: false, description: 'Number of logs to retrieve' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of logs to skip' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMS logs retrieved successfully',
  })
  async getSmsLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.smsService.getSmsLogs(limit || 50, offset || 0);
  }

  @Get('logs/recipient')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiQuery({ name: 'recipient', required: true, description: 'Phone number to get logs for' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMS logs for recipient retrieved successfully',
  })
  async getSmsLogsByRecipient(@Query('recipient') recipient: string) {
    return this.smsService.getSmsLogsByRecipient(recipient);
  }

  @Get('stats')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SMS statistics retrieved successfully',
  })
  async getSmsStats() {
    return this.smsService.getSmsStats();
  }

  // WhatsApp endpoints
  @Post('whatsapp/send')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'WhatsApp message sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid WhatsApp message data or service not configured',
  })
  async sendWhatsAppMessage(@Body() message: WhatsAppMessage) {
    return this.whatsappService.sendWhatsAppMessage(message);
  }

  @Post('whatsapp/send-bulk')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk WhatsApp messages sent successfully',
  })
  async sendBulkWhatsAppMessages(@Body() messages: WhatsAppMessage[]) {
    return this.whatsappService.sendBulkWhatsAppMessages(messages);
  }

  @Get('whatsapp/logs')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiQuery({ name: 'limit', required: false, description: 'Number of logs to retrieve' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of logs to skip' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'WhatsApp logs retrieved successfully',
  })
  async getWhatsAppLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.whatsappService.getWhatsAppLogs(limit || 50, offset || 0);
  }

  @Get('whatsapp/stats')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'WhatsApp statistics retrieved successfully',
  })
  async getWhatsAppStats() {
    return this.whatsappService.getWhatsAppStats();
  }
}
