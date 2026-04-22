import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import type { Integration } from '@sentry/types';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class SentryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SentryService.name);

  constructor(private configService: ConfigService<AllConfigType>) {}

  onModuleInit() {
    const sentryConfig = this.configService.get('sentry', { infer: true });

    if (sentryConfig?.enabled && sentryConfig?.dsn) {
      // Profiling relies on a native prebuilt binary that may not exist for
      // the current Node ABI (e.g. Node 25). Load it defensively so a missing
      // binary disables profiling instead of crashing the process.
      const integrations: Integration[] = [];
      let profilingEnabled = false;
      try {
        const { nodeProfilingIntegration } = require('@sentry/profiling-node');
        integrations.push(nodeProfilingIntegration());
        profilingEnabled = true;
      } catch (err) {
        this.logger.warn(
          `@sentry/profiling-node unavailable, continuing without profiling: ${(err as Error).message}`,
        );
      }

      Sentry.init({
        dsn: sentryConfig.dsn,
        environment: sentryConfig.environment,
        integrations,
        tracesSampleRate: sentryConfig.tracesSampleRate,
        profilesSampleRate: profilingEnabled
          ? sentryConfig.profilesSampleRate
          : 0,
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
