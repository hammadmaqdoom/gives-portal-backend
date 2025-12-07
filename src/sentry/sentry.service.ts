import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class SentryService implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService<AllConfigType>) {}

  onModuleInit() {
    const sentryConfig = this.configService.get('sentry', { infer: true });

    if (sentryConfig?.enabled && sentryConfig?.dsn) {
      Sentry.init({
        dsn: sentryConfig.dsn,
        environment: sentryConfig.environment,
        integrations: [nodeProfilingIntegration()],
        // Performance Monitoring
        tracesSampleRate: sentryConfig.tracesSampleRate,
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: sentryConfig.profilesSampleRate,
      });

      console.log(
        `✅ Sentry initialized for environment: ${sentryConfig.environment}`,
      );
    } else {
      console.log(
        'ℹ️  Sentry is disabled (no DSN provided or SENTRY_ENABLED=false)',
      );
    }
  }

  onModuleDestroy() {
    // Flush any pending events before shutdown
    void Sentry.close(2000).then(() => {
      console.log('Sentry closed');
    });
  }
}
