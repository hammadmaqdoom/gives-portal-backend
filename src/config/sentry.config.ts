import { registerAs } from '@nestjs/config';
import { SentryConfig } from './sentry-config.type';
import validateConfig from '../utils/validate-config';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  SENTRY_DSN: string;

  @IsString()
  @IsOptional()
  SENTRY_ENVIRONMENT: string;

  @IsBoolean()
  @IsOptional()
  SENTRY_ENABLED: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  SENTRY_TRACES_SAMPLE_RATE: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  SENTRY_PROFILES_SAMPLE_RATE: number;
}

export default registerAs<SentryConfig>('sentry', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const enabled =
    process.env.SENTRY_ENABLED === 'true' || !!process.env.SENTRY_DSN;

  return {
    dsn: process.env.SENTRY_DSN || null,
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    enabled,
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : enabled
        ? 0.1
        : 0,
    profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
      : enabled
        ? 0.1
        : 0,
  };
});
