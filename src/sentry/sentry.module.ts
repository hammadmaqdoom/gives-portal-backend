import { Module, Global } from '@nestjs/common';
import { SentryService } from './sentry.service';
import { SentryController } from './sentry.controller';

@Global()
@Module({
  controllers: [SentryController],
  providers: [SentryService],
  exports: [SentryService],
})
export class SentryModule {}
