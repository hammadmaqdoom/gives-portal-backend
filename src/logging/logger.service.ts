import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';

export interface LogContext {
  userId?: string;
  action?: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  log(message: string, context?: LogContext) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...context,
    };
    this.logger.log(JSON.stringify(logData));
  }

  error(message: string, trace?: string, context?: LogContext) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      trace,
      ...context,
    };
    this.logger.error(JSON.stringify(logData));
  }

  warn(message: string, context?: LogContext) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...context,
    };
    this.logger.warn(JSON.stringify(logData));
  }

  debug(message: string, context?: LogContext) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      ...context,
    };
    this.logger.debug(JSON.stringify(logData));
  }

  verbose(message: string, context?: LogContext) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'verbose',
      message,
      ...context,
    };
    this.logger.verbose(JSON.stringify(logData));
  }

  // Audit trail specific methods
  audit(action: string, resource: string, userId?: string, details?: any) {
    this.log(`AUDIT: ${action} on ${resource}`, {
      action,
      resource,
      userId,
      details,
      type: 'audit',
    });
  }

  security(event: string, userId?: string, details?: any) {
    this.log(`SECURITY: ${event}`, {
      event,
      userId,
      details,
      type: 'security',
    });
  }
}
