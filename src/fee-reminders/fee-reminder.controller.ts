import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { Roles } from '../roles/roles.decorator';
import { FeeReminderService } from './fee-reminder.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Fee Reminders')
@Controller({
  path: 'fee-reminders',
  version: '1',
})
export class FeeReminderController {
  constructor(private readonly feeReminderService: FeeReminderService) {}

  @Post('send/:invoiceId')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.user)
  @ApiParam({
    name: 'invoiceId',
    description: 'Invoice ID to send reminder for',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fee reminder sent successfully',
  })
  async sendFeeReminder(@Param('invoiceId') invoiceId: string) {
    await this.feeReminderService.sendFeeReminderForInvoice(+invoiceId);
    return { message: 'Fee reminder sent successfully' };
  }

  @Post('send-upcoming/:invoiceId')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.user)
  @ApiParam({
    name: 'invoiceId',
    description: 'Invoice ID to send upcoming due date reminder for',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming due date reminder sent successfully',
  })
  async sendUpcomingDueDateReminder(@Param('invoiceId') invoiceId: string) {
    await this.feeReminderService.sendUpcomingDueDateReminder(+invoiceId);
    return { message: 'Upcoming due date reminder sent successfully' };
  }

  @Get('logs')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.user)
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of logs to retrieve',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of logs to skip',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fee reminder logs retrieved successfully',
  })
  async getReminderLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.feeReminderService.getReminderLogs(limit || 50, offset || 0);
  }

  @Get('logs/student/:studentId')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.user)
  @ApiParam({
    name: 'studentId',
    description: 'Student ID to get reminder logs for',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fee reminder logs for student retrieved successfully',
  })
  async getReminderLogsByStudent(@Param('studentId') studentId: string) {
    return this.feeReminderService.getReminderLogsByStudent(+studentId);
  }

  @Get('stats')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fee reminder statistics retrieved successfully',
  })
  async getReminderStats() {
    return this.feeReminderService.getReminderStats();
  }
}
