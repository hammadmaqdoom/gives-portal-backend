import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuditLogsService, AuditLogQueryDto } from './audit-logs.service';
import { AuditEventType } from './entities/audit-log.entity';

@ApiTags('Audit Logs')
@Controller({
  path: 'audit-logs',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.superAdmin, RoleEnum.admin)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit logs retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'eventType', required: false, enum: AuditEventType })
  @ApiQuery({
    name: 'eventTypes',
    required: false,
    type: String,
    description:
      'Comma-separated list of event types. Overrides eventType when provided.',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'resourceId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit log stats retrieved successfully',
  })
  getStats() {
    return this.auditLogsService.getStats();
  }
}
