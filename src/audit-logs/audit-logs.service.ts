import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
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
}

export interface AuditLogQueryDto {
  page?: number;
  limit?: number;
  eventType?: AuditEventType;
  userId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<void> {
    try {
      const log = this.auditLogRepository.create({
        eventType: dto.eventType,
        userId: dto.userId != null ? Number(dto.userId) : null,
        userEmail: dto.userEmail ?? null,
        userRole: dto.userRole ?? null,
        resource: dto.resource ?? null,
        resourceId: dto.resourceId ?? null,
        details: dto.details ?? null,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
      });
      await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`, error.stack);
    }
  }

  async findAll(query: AuditLogQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 25, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.eventType) {
      where.eventType = query.eventType;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.search) {
      where.userEmail = ILike(`%${query.search}%`);
    }

    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    } else if (query.startDate) {
      where.createdAt = Between(new Date(query.startDate), new Date());
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
