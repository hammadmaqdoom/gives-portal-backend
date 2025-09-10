import { registerAs } from '@nestjs/config';
import { RedisConfig } from './redis-config.type';

export default registerAs(
  'redis',
  (): RedisConfig => ({
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  }),
);
