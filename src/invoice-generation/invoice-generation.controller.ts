import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { Roles } from '../roles/roles.decorator';
import { InvoiceGenerationService } from './invoice-generation.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Invoice Generation')
@Controller({
  path: 'invoice-generation',
  version: '1',
})
export class InvoiceGenerationController {
  constructor(
    private readonly invoiceGenerationService: InvoiceGenerationService,
  ) {}

  @Post('generate-monthly')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly invoices generated successfully',
  })
  async generateMonthlyInvoices() {
    return this.invoiceGenerationService.generateMonthlyInvoices();
  }

  @Post('generate-quarterly')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quarterly invoices generated successfully',
  })
  async generateQuarterlyInvoices() {
    return this.invoiceGenerationService.generateQuarterlyInvoices();
  }

  @Post('generate-yearly')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Yearly invoices generated successfully',
  })
  async generateYearlyInvoices() {
    return this.invoiceGenerationService.generateYearlyInvoices();
  }

  @Post('generate-for-student/:studentId')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice generated for student successfully',
  })
  async generateInvoiceForStudent(@Param('studentId') studentId: number) {
    return this.invoiceGenerationService.generateInvoiceForStudent(studentId);
  }

  @Get('logs')
  @Roles(RoleEnum.admin, RoleEnum.user)
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
    description: 'Invoice generation logs retrieved successfully',
  })
  async getGenerationLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.invoiceGenerationService.getGenerationLogs(
      limit || 50,
      offset || 0,
    );
  }

  @Get('stats')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice generation statistics retrieved successfully',
  })
  async getGenerationStats() {
    return this.invoiceGenerationService.getGenerationStats();
  }
}
