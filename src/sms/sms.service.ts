import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { SmsLogEntity } from './infrastructure/persistence/relational/entities/sms-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';

export interface SmsMessage {
  to: string;
  message: string;
  mask?: string;
}

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: string;
}

export interface SmsLog {
  id?: number;
  recipient: string;
  message: string;
  provider: string;
  messageId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  statusCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly settingsService: SettingsService,
    @InjectRepository(SmsLogEntity)
    private readonly smsLogRepository: Repository<SmsLogEntity>,
  ) {}

  async sendSms(smsMessage: SmsMessage): Promise<SmsResponse> {
    try {
      const settings = await this.settingsService.getSettingsOrCreate();

      if (!settings.smsEnabled) {
        throw new BadRequestException('SMS service is not enabled');
      }

      if (
        !settings.smsProvider ||
        !settings.smsApiEmail ||
        !settings.smsApiKey
      ) {
        throw new BadRequestException('SMS configuration is incomplete');
      }

      // Log the SMS attempt
      const smsLog = await this.createSmsLog({
        recipient: smsMessage.to,
        message: smsMessage.message,
        provider: settings.smsProvider,
        status: 'pending',
      });

      let response: SmsResponse;

      if (settings.smsProvider === 'branded_sms_pakistan') {
        response = await this.sendBrandedSmsPakistan(smsMessage, settings);
      } else {
        throw new BadRequestException(
          `Unsupported SMS provider: ${settings.smsProvider}`,
        );
      }

      // Update SMS log with response
      await this.updateSmsLog(smsLog.id!, {
        messageId: response.messageId,
        status: response.success ? 'sent' : 'failed',
        statusCode: response.statusCode,
        errorMessage: response.error,
        sentAt: response.success ? new Date() : undefined,
      });

      return response;
    } catch (error) {
      this.logger.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendBrandedSmsPakistan(
    smsMessage: SmsMessage,
    settings: any,
  ): Promise<SmsResponse> {
    try {
      const apiUrl =
        settings.smsApiUrl || 'https://secure.h3techs.com/sms/api/send';
      const mask = smsMessage.mask || settings.smsMask || 'H3 TEST SMS';

      const data = {
        email: settings.smsApiEmail,
        key: settings.smsApiKey,
        mask: encodeURIComponent(mask),
        to: smsMessage.to,
        message: encodeURIComponent(smsMessage.message),
      };

      this.logger.debug('Sending SMS to Branded SMS Pakistan:', {
        url: apiUrl,
        to: smsMessage.to,
        mask,
        testMode: settings.smsTestMode,
      });

      const response = await axios.post(apiUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      });

      const responseText = response.data;
      this.logger.debug('Branded SMS Pakistan response:', responseText);

      // Parse response - Branded SMS Pakistan returns different formats
      if (typeof responseText === 'string') {
        // Check if response contains error codes
        const errorCodes = [
          '101',
          '201',
          '202',
          '203',
          '204',
          '205',
          '206',
          '207',
          '208',
          '209',
          '210',
          '211',
          '212',
          '213',
          '214',
          '215',
          '216',
          '217',
          '218',
          '219',
          '220',
          '221',
          '222',
          '223',
          '225',
        ];

        const hasError = errorCodes.some((code) => responseText.includes(code));

        if (hasError) {
          return {
            success: false,
            error: `SMS API Error: ${responseText}`,
            statusCode: responseText,
          };
        }

        // Check for success (code 000)
        if (
          responseText.includes('000') ||
          responseText.includes('Message Queued Successfully')
        ) {
          // Extract message ID if present
          const messageIdMatch = responseText.match(/(\d+)/);
          return {
            success: true,
            messageId: messageIdMatch ? messageIdMatch[1] : undefined,
            statusCode: '000',
          };
        }
      }

      // If we can't parse the response, assume it's successful if no error codes
      return {
        success: true,
        messageId: undefined,
        statusCode: 'unknown',
      };
    } catch (error) {
      this.logger.error('Error calling Branded SMS Pakistan API:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendBulkSms(messages: SmsMessage[]): Promise<SmsResponse[]> {
    const results: SmsResponse[] = [];

    for (const message of messages) {
      const result = await this.sendSms(message);
      results.push(result);

      // Add delay between messages to avoid rate limiting
      if (messages.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  async checkSmsStatus(
    messageId: string,
  ): Promise<{ status: string; deliveredAt?: Date }> {
    try {
      const settings = await this.settingsService.getSettingsOrCreate();

      if (settings.smsProvider === 'branded_sms_pakistan') {
        const apiUrl = 'https://secure.h3techs.com/sms/api/report';
        const params = {
          email: settings.smsApiEmail,
          key: settings.smsApiKey,
          id: messageId,
        };

        const response = await axios.get(apiUrl, { params });

        // Parse the response to determine status
        const responseText = response.data;

        if (
          responseText.includes('delivered') ||
          responseText.includes('success')
        ) {
          return { status: 'delivered', deliveredAt: new Date() };
        } else if (
          responseText.includes('pending') ||
          responseText.includes('queued')
        ) {
          return { status: 'pending' };
        } else {
          return { status: 'failed' };
        }
      }

      return { status: 'unknown' };
    } catch (error) {
      this.logger.error('Error checking SMS status:', error);
      return { status: 'unknown' };
    }
  }

  async getSmsBalance(): Promise<{ balance: number; expiryDate?: string }> {
    try {
      const settings = await this.settingsService.getSettingsOrCreate();

      if (settings.smsProvider === 'branded_sms_pakistan') {
        const apiUrl = 'https://secure.h3techs.com/sms/api/balance';
        const params = {
          email: settings.smsApiEmail,
          key: settings.smsApiKey,
        };

        const response = await axios.get(apiUrl, { params });
        const responseText = response.data;

        // Parse balance response
        const balanceMatch = responseText.match(/balance[:\s]*(\d+)/i);
        const expiryMatch = responseText.match(/expir[:\s]*([^\s\n]+)/i);

        return {
          balance: balanceMatch ? parseInt(balanceMatch[1]) : 0,
          expiryDate: expiryMatch ? expiryMatch[1] : undefined,
        };
      }

      return { balance: 0 };
    } catch (error) {
      this.logger.error('Error getting SMS balance:', error);
      return { balance: 0 };
    }
  }

  async createSmsLog(logData: Partial<SmsLog>): Promise<SmsLogEntity> {
    const smsLog = this.smsLogRepository.create({
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

    return this.smsLogRepository.save(smsLog);
  }

  async updateSmsLog(id: number, updateData: Partial<SmsLog>): Promise<void> {
    await this.smsLogRepository.update(id, updateData);
  }

  async getSmsLogs(
    limit: number = 50,
    offset: number = 0,
  ): Promise<SmsLogEntity[]> {
    return this.smsLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getSmsLogsByRecipient(recipient: string): Promise<SmsLogEntity[]> {
    return this.smsLogRepository.find({
      where: { recipient },
      order: { createdAt: 'DESC' },
    });
  }

  async getSmsStats(): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  }> {
    const logs = await this.smsLogRepository.find();

    const stats = {
      total: logs.length,
      sent: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
    };

    logs.forEach((log) => {
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
