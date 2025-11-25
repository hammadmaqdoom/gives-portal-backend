import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { SmsLogEntity } from './infrastructure/persistence/relational/entities/sms-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'media';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly settingsService: SettingsService,
    @InjectRepository(SmsLogEntity)
    private readonly smsLogRepository: Repository<SmsLogEntity>,
  ) {}

  async sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const settings = await this.settingsService.getSettingsOrCreate();
      
      if (!settings.whatsappEnabled) {
        throw new BadRequestException('WhatsApp service is not enabled');
      }

      if (!settings.whatsappDeviceId || !settings.smsApiEmail || !settings.smsApiKey) {
        throw new BadRequestException('WhatsApp configuration is incomplete');
      }

      // Log the WhatsApp message attempt
      const logData = {
        recipient: message.to,
        message: message.message,
        provider: 'whatsapp_branded_sms_pakistan',
        status: 'pending' as const,
      };

      const whatsappLog = await this.createWhatsAppLog(logData);

      const response = await this.sendBrandedWhatsAppPakistan(message, settings);

      // Update log with response
      await this.updateWhatsAppLog(whatsappLog.id!, {
        messageId: response.messageId,
        status: response.success ? 'sent' : 'failed',
        statusCode: response.statusCode,
        errorMessage: response.error,
        sentAt: response.success ? new Date() : undefined,
      });

      return response;
    } catch (error) {
      this.logger.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendBrandedWhatsAppPakistan(
    message: WhatsAppMessage,
    settings: any,
  ): Promise<WhatsAppResponse> {
    try {
      const apiUrl = settings.whatsappApiUrl || 'https://secure.h3techs.com/sms/api/send_whatsapp';
      
      const data = {
        email: settings.smsApiEmail,
        key: settings.smsApiKey,
        to: message.to,
        message: encodeURIComponent(message.message),
        wd_id: settings.whatsappDeviceId,
        type: message.type || 'text',
      };

      // Add media fields if it's a media message
      if (message.type === 'media' && message.mediaUrl && message.mediaType) {
        data['media_url'] = message.mediaUrl;
        data['media_type'] = message.mediaType;
      }

      this.logger.debug('Sending WhatsApp message to Branded SMS Pakistan:', {
        url: apiUrl,
        to: message.to,
        type: message.type,
        deviceId: settings.whatsappDeviceId,
      });

      const response = await axios.post(apiUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      });

      const responseText = response.data;
      this.logger.debug('Branded WhatsApp response:', responseText);

      // Parse response similar to SMS
      if (typeof responseText === 'string') {
        const errorCodes = [
          '101', '201', '202', '203', '204', '205', '206', '207', '208', '209',
          '210', '211', '212', '213', '214', '215', '216', '217', '218', '219',
          '220', '221', '222', '223', '225'
        ];

        const hasError = errorCodes.some(code => responseText.includes(code));
        
        if (hasError) {
          return {
            success: false,
            error: `WhatsApp API Error: ${responseText}`,
            statusCode: responseText,
          };
        }

        if (responseText.includes('000') || responseText.includes('Message Queued Successfully')) {
          const messageIdMatch = responseText.match(/(\d+)/);
          return {
            success: true,
            messageId: messageIdMatch ? messageIdMatch[1] : undefined,
            statusCode: '000',
          };
        }
      }

      return {
        success: true,
        messageId: undefined,
        statusCode: 'unknown',
      };
    } catch (error) {
      this.logger.error('Error calling Branded WhatsApp API:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendBulkWhatsAppMessages(messages: WhatsAppMessage[]): Promise<WhatsAppResponse[]> {
    const results: WhatsAppResponse[] = [];
    
    for (const message of messages) {
      const result = await this.sendWhatsAppMessage(message);
      results.push(result);
      
      // Add delay between messages to avoid rate limiting
      if (messages.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  async createWhatsAppLog(logData: Partial<any>): Promise<SmsLogEntity> {
    const whatsappLog = this.smsLogRepository.create({
      recipient: logData.recipient,
      message: logData.message,
      provider: logData.provider,
      messageId: logData.messageId,
      status: logData.status || 'pending',
      statusCode: logData.statusCode,
      errorMessage: logData.errorMessage,
      sentAt: logData.sentAt,
      deliveredAt: logData.deliveredAt,
    });

    return this.smsLogRepository.save(whatsappLog);
  }

  async updateWhatsAppLog(id: number, updateData: Partial<any>): Promise<void> {
    await this.smsLogRepository.update(id, updateData);
  }

  async getWhatsAppLogs(limit: number = 50, offset: number = 0): Promise<SmsLogEntity[]> {
    return this.smsLogRepository.find({
      where: { provider: 'whatsapp_branded_sms_pakistan' },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getWhatsAppStats(): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  }> {
    const logs = await this.smsLogRepository.find({
      where: { provider: 'whatsapp_branded_sms_pakistan' },
    });
    
    const stats = {
      total: logs.length,
      sent: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
    };

    logs.forEach(log => {
      switch (log.status) {
        case 'sent':
          stats.sent++;
          break;
        case 'delivered':
          stats.delivered++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'pending':
          stats.pending++;
          break;
      }
    });

    return stats;
  }
}
