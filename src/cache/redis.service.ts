import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis | null = null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.enabled =
      this.configService.get('redis.enabled', { infer: true }) ?? false;
    if (this.enabled) {
      this.redis = new Redis({
        host: this.configService.get('redis.host', { infer: true }),
        port: this.configService.get('redis.port', { infer: true }),
        password: this.configService.get('redis.password', { infer: true }),
        db: this.configService.get('redis.db', { infer: true }),
        maxRetriesPerRequest: 3,
      });
      this.redis.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });
      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });
    } else {
      this.logger.warn(
        'Redis is disabled via configuration. All RedisService methods will be no-ops.',
      );
    }
  }

  async set(key: string, value: string, expiration?: number): Promise<void> {
    if (!this.enabled || !this.redis) return;
    if (expiration) {
      await this.redis.setex(key, expiration, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.enabled || !this.redis) return null;
    return await this.redis.get(key);
  }

  async delete(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return;
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) return false;
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async expire(key: string, expiration: number): Promise<void> {
    if (!this.enabled || !this.redis) return;
    await this.redis.expire(key, expiration);
  }

  async ttl(key: string): Promise<number> {
    if (!this.enabled || !this.redis) return -2; // -2 means key does not exist
    return await this.redis.ttl(key);
  }

  async flushdb(): Promise<void> {
    if (!this.enabled || !this.redis) return;
    await this.redis.flushdb();
  }

  async quit(): Promise<void> {
    if (!this.enabled || !this.redis) return;
    await this.redis.quit();
  }
}
