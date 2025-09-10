import { Injectable, OnModuleInit } from '@nestjs/common';
import fs from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { AllConfigType } from '../config/config.type';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MailerService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly settingsService: SettingsService,
  ) {
    // Initialize with default config, will be updated with dynamic config
    this.transporter = this.createTransporter();
  }

  async onModuleInit() {
    await this.updateTransporterConfig();
  }

  private createTransporter(config?: any): nodemailer.Transporter {
    const smtpConfig = config || {
      host: this.configService.get('mail.host', { infer: true }),
      port: this.configService.get('mail.port', { infer: true }),
      ignoreTLS: this.configService.get('mail.ignoreTLS', { infer: true }),
      secure: this.configService.get('mail.secure', { infer: true }),
      requireTLS: this.configService.get('mail.requireTLS', { infer: true }),
      auth: {
        user: this.configService.get('mail.user', { infer: true }),
        pass: this.configService.get('mail.password', { infer: true }),
      },
    };

    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      ignoreTLS: smtpConfig.ignoreTLS,
      secure: smtpConfig.secure,
      requireTLS: smtpConfig.requireTLS,
      auth: smtpConfig.auth,
    });
  }

  async updateTransporterConfig() {
    try {
      const smtpConfig = await this.settingsService.getSmtpConfig();
      
      // Only update if SMTP config is available
      if (smtpConfig.smtpHost && smtpConfig.smtpUser) {
        this.transporter = this.createTransporter({
          host: smtpConfig.smtpHost,
          port: smtpConfig.smtpPort,
          ignoreTLS: smtpConfig.smtpIgnoreTls,
          secure: smtpConfig.smtpSecure,
          requireTLS: smtpConfig.smtpRequireTls,
          auth: {
            user: smtpConfig.smtpUser,
            pass: smtpConfig.smtpPassword,
          },
        });
      }
    } catch (error) {
      console.error('Failed to update SMTP configuration:', error);
      // Keep using default configuration
    }
  }

  async refreshSmtpConfig() {
    await this.updateTransporterConfig();
  }

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath: string;
    context: Record<string, unknown>;
  }): Promise<void> {
    let html: string | undefined;
    if (templatePath) {
      const template = await fs.readFile(templatePath, 'utf-8');
      html = Handlebars.compile(template, {
        strict: true,
      })(context);
    }

    // Get dynamic from email and name from settings
    let fromEmail: string;
    let fromName: string;
    
    try {
      const smtpConfig = await this.settingsService.getSmtpConfig();
      fromEmail = smtpConfig.smtpFromEmail || this.configService.get('mail.defaultEmail', { infer: true }) || 'noreply@example.com';
      fromName = smtpConfig.smtpFromName || this.configService.get('mail.defaultName', { infer: true }) || 'System';
    } catch (error) {
      // Fallback to config service values
      fromEmail = this.configService.get('mail.defaultEmail', { infer: true }) || 'noreply@example.com';
      fromName = this.configService.get('mail.defaultName', { infer: true }) || 'System';
    }

    await this.transporter.sendMail({
      ...mailOptions,
      from: mailOptions.from || `"${fromName}" <${fromEmail}>`,
      html: mailOptions.html ? mailOptions.html : html,
    });
  }
}
