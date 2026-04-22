import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike, In } from 'typeorm';
import { AuditLogEntity, AuditEventType } from './entities/audit-log.entity';

export interface CreateAuditLogDto {
  eventType: AuditEventType;
  userId?: number | string | null;
  userEmail?: string | null;
  userRole?: string | null;
  resource?: string | null;
  resourceId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  countryCode?: string | null;
  city?: string | null;
}

interface GeoInfo {
  countryCode: string | null;
  city: string | null;
  timestamp: number;
}

export interface AuditLogQueryDto {
  page?: number;
  limit?: number;
  eventType?: AuditEventType;
  // Comma-separated list or array; if provided overrides eventType.
  // Useful for filtering the audit-log view to biometric-only events.
  eventTypes?: AuditEventType[] | string;
  userId?: number;
  resource?: string;
  resourceId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);
  private readonly geoCache = new Map<string, GeoInfo>();
  private readonly GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly GEO_CACHE_MAX = 1000;

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<void> {
    try {
      const cleanIp = this.cleanIpAddress(dto.ipAddress ?? null);
      const geo = await this.resolveGeo(cleanIp);

      const log = this.auditLogRepository.create({
        eventType: dto.eventType,
        userId: dto.userId != null ? Number(dto.userId) : null,
        userEmail: dto.userEmail ?? null,
        userRole: dto.userRole ?? null,
        resource: dto.resource ?? null,
        resourceId: dto.resourceId ?? null,
        details: dto.details ?? null,
        ipAddress: cleanIp,
        countryCode: dto.countryCode ?? geo.countryCode,
        city: dto.city ?? geo.city,
        userAgent: dto.userAgent ?? null,
      });
      await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`, error.stack);
    }
  }

  private normalizeEventTypes(
    value: AuditEventType[] | string | undefined,
  ): AuditEventType[] {
    if (!value) return [];
    const raw = Array.isArray(value)
      ? value
      : value.split(',').map((v) => v.trim());
    return raw
      .filter((v): v is AuditEventType =>
        Object.values(AuditEventType).includes(v as AuditEventType),
      );
  }

  private cleanIpAddress(ip: string | null): string | null {
    if (!ip) return null;
    let cleaned = ip.trim();
    if (cleaned.startsWith('::ffff:')) {
      cleaned = cleaned.substring(7);
    }
    if (cleaned.includes(',')) {
      cleaned = cleaned.split(',')[0].trim();
    }
    return cleaned || null;
  }

  private async resolveGeo(ip: string | null): Promise<{ countryCode: string | null; city: string | null }> {
    const empty = { countryCode: null, city: null };
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('192.168.')) {
      return empty;
    }

    const cached = this.geoCache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.GEO_CACHE_TTL) {
      return { countryCode: cached.countryCode, city: cached.city };
    }

    try {
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,countryCode,city`,
        { signal: AbortSignal.timeout(3000) },
      );

      if (!response.ok) {
        return empty;
      }

      const data = await response.json();

      if (data.status === 'success') {
        const result = {
          countryCode: data.countryCode?.toUpperCase() || null,
          city: data.city || null,
        };
        this.cacheGeo(ip, result.countryCode, result.city);
        return result;
      }

      return empty;
    } catch {
      return empty;
    }
  }

  private cacheGeo(ip: string, countryCode: string | null, city: string | null): void {
    this.geoCache.set(ip, { countryCode, city, timestamp: Date.now() });
    if (this.geoCache.size > this.GEO_CACHE_MAX) {
      const entries = Array.from(this.geoCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      this.geoCache.clear();
      entries.slice(0, this.GEO_CACHE_MAX).forEach(([key, value]) => {
        this.geoCache.set(key, value);
      });
    }
  }

  async findAll(query: AuditLogQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 25, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    const typeList = this.normalizeEventTypes(query.eventTypes);
    if (typeList.length > 0) {
      where.eventType = In(typeList);
    } else if (query.eventType) {
      where.eventType = query.eventType;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.resource) {
      where.resource = query.resource;
    }

    if (query.resourceId) {
      where.resourceId = query.resourceId;
    }

    if (query.search) {
      where.userEmail = ILike(`%${query.search}%`);
    }

    // Dates from the UI arrive as `yyyy-mm-dd`, which `new Date(...)` parses as
    // UTC midnight. That would (a) miss events earlier on the chosen start day
    // in negative-offset timezones and (b) miss events later on the end day
    // everywhere. Snap to start-of-day / end-of-day so the inclusive range
    // behaves the way admins expect from a date picker.
    const toStartOfDay = (value: string | undefined): Date | null => {
      if (!value) return null;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const toEndOfDay = (value: string | undefined): Date | null => {
      if (!value) return null;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      d.setHours(23, 59, 59, 999);
      return d;
    };
    const start = toStartOfDay(query.startDate);
    const end = toEndOfDay(query.endDate);
    if (start && end) {
      where.createdAt = Between(start, end);
    } else if (start) {
      where.createdAt = Between(start, new Date());
    } else if (end) {
      where.createdAt = Between(new Date(0), end);
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalLogs, last24hCount, loginSuccessCount, loginFailureCount] =
      await Promise.all([
        this.auditLogRepository.count(),
        this.auditLogRepository.count({
          where: { createdAt: Between(last24h, now) },
        }),
        this.auditLogRepository.count({
          where: {
            eventType: AuditEventType.LOGIN_SUCCESS,
            createdAt: Between(last7d, now),
          },
        }),
        this.auditLogRepository.count({
          where: {
            eventType: AuditEventType.LOGIN_FAILURE,
            createdAt: Between(last7d, now),
          },
        }),
      ]);

    return {
      totalLogs,
      last24hCount,
      loginSuccessCount,
      loginFailureCount,
    };
  }
}
