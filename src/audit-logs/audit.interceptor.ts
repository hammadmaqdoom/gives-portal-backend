import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogsService } from './audit-logs.service';
import { AuditEventType } from './entities/audit-log.entity';

const IGNORED_KEYWORDS = [
  'audit-logs',
  'auth/me',
  'auth/refresh',
  'auth/email/login',
  'auth/j/login',
  'auth/logout',
  'auth/email/register',
  'auth/j/register',
  'dashboard',
];

const METHOD_EVENT_MAP: Record<string, AuditEventType> = {
  POST: AuditEventType.DATA_CREATE,
  PUT: AuditEventType.DATA_UPDATE,
  PATCH: AuditEventType.DATA_UPDATE,
  DELETE: AuditEventType.DATA_DELETE,
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!METHOD_EVENT_MAP[method]) {
      return next.handle();
    }

    const path: string = request.route?.path || request.url || '';
    if (IGNORED_KEYWORDS.some((keyword) => path.includes(keyword))) {
      return next.handle();
    }

    const resource = this.extractResource(path);
    if (!resource) {
      return next.handle();
    }

    const user = request.user;
    const eventType = this.resolveEventType(method, path, request.body);

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const resourceId =
            request.params?.id?.toString() ||
            responseBody?.id?.toString() ||
            responseBody?.data?.id?.toString() ||
            null;

          this.auditLogsService.create({
            eventType,
            userId: user?.id ?? null,
            userEmail: user?.email ?? null,
            userRole: user?.role?.name ?? user?.role?.id?.toString() ?? null,
            resource,
            resourceId,
            details: this.sanitizeDetails(method, request.body),
            ipAddress: request.ip || request.headers['x-forwarded-for'] || null,
            userAgent: request.headers['user-agent'] || null,
          });
        },
      }),
    );
  }

  private extractResource(path: string): string | null {
    const cleaned = path
      .replace(/^\/api\//, '')
      .replace(/^v\d+\//, '')
      .replace(/\/:[^/]+/g, '')
      .replace(/\/\d+/g, '');

    const segments = cleaned.split('/').filter(Boolean);
    const segment = segments[0];
    if (!segment) return null;

    return segment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private resolveEventType(
    method: string,
    path: string,
    body: any,
  ): AuditEventType {
    if (path.includes('settings')) {
      return AuditEventType.SETTINGS_CHANGE;
    }

    if (
      (path.includes('users') || path.includes('roles')) &&
      body?.role &&
      (method === 'PATCH' || method === 'PUT')
    ) {
      return AuditEventType.ROLE_CHANGE;
    }

    return METHOD_EVENT_MAP[method] || AuditEventType.DATA_UPDATE;
  }

  private sanitizeDetails(
    method: string,
    body: any,
  ): Record<string, any> | null {
    if (!body || method === 'DELETE') return null;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'oldPassword',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'hash',
      'secret',
    ];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
