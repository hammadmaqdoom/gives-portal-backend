import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyRateEntity } from './currency-rate.entity';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class CurrencyService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly ipCache = new Map<
    string,
    { currency: string; timestamp: number }
  >();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    @InjectRepository(CurrencyRateEntity)
    private readonly currencyRepo: Repository<CurrencyRateEntity>,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {}
  async onModuleInit() {
    // Warm cache for today on startup
    try {
      await this.getRateForDate(new Date());
      this.logger.log('Currency rates cache warmed for today');
    } catch (e) {
      this.logger.warn('Could not warm currency cache on startup');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async prefetchDailyRates() {
    try {
      await this.getRateForDate(new Date());
      this.logger.log('Prefetched daily currency rates');
    } catch (e) {
      this.logger.error('Failed to prefetch daily currency rates');
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  async getDefaultCurrency(): Promise<string> {
    const settings = await this.settingsService.getSettingsOrCreate();
    return (settings as any).defaultCurrency || 'PKR';
  }

  async getRateForDate(date: Date, base = 'USD'): Promise<CurrencyRateEntity> {
    const day = this.formatDate(date);
    let record = await this.currencyRepo.findOne({
      where: { date: day, base },
    });
    if (record) return record;

    // Limit: fetch at most once per day
    const appId = this.configService.get<string>('OPENEXCHANGERATES_APP_ID');
    if (!appId) {
      this.logger.warn(
        'OPENEXCHANGERATES_APP_ID is not set; using latest cached/synthetic rates',
      );
      const latest = await this.currencyRepo.find({
        order: { date: 'DESC' },
        take: 1,
      });
      if (latest.length) return latest[0];
      return {
        id: 0,
        date: day,
        base: 'USD',
        timestamp: Math.floor(Date.now() / 1000),
        provider: 'openexchangerates',
        rates: { PKR: 277 },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as CurrencyRateEntity;
    }
    const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          this.logger.warn(
            'OpenExchangeRates 401 (invalid app_id); using latest cached/synthetic rates',
          );
        } else {
          this.logger.error(`OpenExchangeRates HTTP ${res.status}`);
        }
        const latest = await this.currencyRepo.find({
          order: { date: 'DESC' },
          take: 1,
        });
        if (latest.length) return latest[0];
        return {
          id: 0,
          date: day,
          base: 'USD',
          timestamp: Math.floor(Date.now() / 1000),
          provider: 'openexchangerates',
          rates: { PKR: 277 },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as CurrencyRateEntity;
      }
      const data = await res.json();
      const providerDate = new Date(
        (data.timestamp || Date.now() / 1000) * 1000,
      );
      const providerDay = this.formatDate(providerDate);
      record = this.currencyRepo.create({
        date: providerDay,
        base: data.base || 'USD',
        timestamp: data.timestamp,
        provider: 'openexchangerates',
        rates: data.rates || {},
      });
      await this.currencyRepo.save(record);
      return record;
    } catch (err) {
      this.logger.error('Failed to fetch currency rates', err as any);
      // fallback to latest available
      const latest = await this.currencyRepo.find({
        order: { date: 'DESC' },
        take: 1,
      });
      if (latest.length) return latest[0];
      // As a last resort, synthesize minimal rates for PKR
      const synthetic: CurrencyRateEntity = {
        id: 0,
        date: day,
        base: 'USD',
        timestamp: Math.floor(Date.now() / 1000),
        provider: 'openexchangerates',
        rates: { PKR: 277 },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as CurrencyRateEntity;
      return synthetic;
    }
  }

  async convert(
    amount: number,
    from: string,
    to: string,
    date = new Date(),
  ): Promise<number> {
    if (!amount || from === to) return amount;
    const { base, rates } = await this.getRateForDate(date);
    const getToBase = (code: string): number => {
      if (code === base) return 1;
      const rate = rates[code];
      if (!rate) throw new Error(`Missing FX rate for ${code}`);
      return rate;
    };
    // Convert via base: from -> base -> to
    const amountInBase = amount / getToBase(from);
    const converted = amountInBase * getToBase(to);
    return Number(converted.toFixed(2));
  }

  /**
   * Determines the appropriate currency based on a country name
   * Returns 'PKR' for Pakistan (and its variations), 'USD' for all others
   */
  getCurrencyForCountry(country?: string): 'PKR' | 'USD' {
    if (!country) {
      return 'USD'; // Default to USD if no country specified
    }

    // Normalize country name for comparison
    const normalizedCountry = country.toLowerCase().trim();

    // Pakistan and its variations
    const pakistanVariations = [
      'pakistan',
      'pk',
      'pak',
      'islamic republic of pakistan',
    ];

    return pakistanVariations.includes(normalizedCountry) ? 'PKR' : 'USD';
  }

  /**
   * Detect currency based on IP geolocation
   * Returns 'PKR' for Pakistan IPs, 'USD' for all others
   */
  async detectCurrencyFromIp(ip: string): Promise<string> {
    // Clean IP address (remove port, handle IPv6)
    const cleanIp = ip?.split(':').pop()?.split(',').shift()?.trim() || '';

    if (!cleanIp || cleanIp === '::1' || cleanIp === '127.0.0.1') {
      // Localhost - default to USD
      return 'USD';
    }

    // Check cache first
    const cached = this.ipCache.get(cleanIp);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.currency;
    }

    try {
      // Use ip-api.com (free, no API key required for basic usage)
      // Alternative: ipapi.co, ipgeolocation.io, etc.
      const response = await fetch(
        `http://ip-api.com/json/${cleanIp}?fields=status,countryCode`,
        { signal: AbortSignal.timeout(3000) }, // 3 second timeout
      );

      if (!response.ok) {
        this.logger.warn(`IP geolocation API returned ${response.status}`);
        return this.cacheAndReturn(cleanIp, 'USD');
      }

      const data = await response.json();

      if (data.status === 'success' && data.countryCode === 'PK') {
        return this.cacheAndReturn(cleanIp, 'PKR');
      }

      // Default to USD for all other countries or failures
      return this.cacheAndReturn(cleanIp, 'USD');
    } catch (error) {
      this.logger.warn(`Failed to detect currency from IP ${cleanIp}:`, error);
      // Fallback to USD on error
      return this.cacheAndReturn(cleanIp, 'USD');
    }
  }

  private cacheAndReturn(ip: string, currency: string): string {
    this.ipCache.set(ip, { currency, timestamp: Date.now() });
    // Clean old cache entries (keep last 1000 entries)
    if (this.ipCache.size > 1000) {
      const entries = Array.from(this.ipCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      this.ipCache.clear();
      entries.slice(0, 1000).forEach(([key, value]) => {
        this.ipCache.set(key, value);
      });
    }
    return currency;
  }

  /**
   * Extract client IP from request headers
   */
  extractClientIp(req: any): string {
    // Check X-Forwarded-For header (for proxies/load balancers)
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    // Check X-Real-IP header
    const realIp = req.headers?.['x-real-ip'];
    if (realIp) {
      return realIp.trim();
    }

    // Fallback to connection remote address
    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
  }
}
