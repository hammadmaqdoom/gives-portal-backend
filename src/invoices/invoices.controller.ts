import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import {
  FilterInvoiceDto,
  SortInvoiceDto,
  QueryInvoiceDto,
} from './dto/query-invoice.dto';
import { PaginationOptionsDto } from '../utils/dto/pagination-options.dto';
import { RolesGuard } from '../roles/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { Invoice } from './domain/invoice';

@ApiTags('Invoices')
@Controller({
  path: 'invoices',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice created successfully',
    type: Invoice,
  })
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get all invoices with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
    type: [Invoice],
  })
  findAll(@Query() queryDto: QueryInvoiceDto) {
    const sortOptions = queryDto.sortBy
      ? [
          {
            key: queryDto.sortBy,
            order: queryDto.sortOrder || 'DESC',
          },
        ]
      : null;

    return this.invoicesService.findManyWithPagination({
      filterOptions: queryDto,
      sortOptions,
      paginationOptions: {
        page: queryDto.page || 1,
        limit: queryDto.limit || 50,
      },
    });
  }

  @Get('stats')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get invoice statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice statistics retrieved successfully',
  })
  getStats() {
    return this.invoicesService.getInvoiceStats();
  }

  @Get('overdue')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get all overdue invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overdue invoices retrieved successfully',
    type: [Invoice],
  })
  getOverdue() {
    return this.invoicesService.findOverdue();
  }

  @Get('student/:studentId')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get invoices for a specific student' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student invoices retrieved successfully',
    type: [Invoice],
  })
  findByStudent(@Param('studentId') studentId: string) {
    return this.invoicesService.findByStudent(+studentId);
  }

  @Get('parent/:parentId')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get invoices for a specific parent' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parent invoices retrieved successfully',
    type: [Invoice],
  })
  findByParent(@Param('parentId') parentId: string) {
    return this.invoicesService.findByParent(+parentId);
  }

  @Get('my-invoices')
  @Roles(RoleEnum.user)
  @ApiOperation({ summary: 'Get current user invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User invoices retrieved successfully',
    type: [Invoice],
  })
  async getMyInvoices(@Request() req) {
    const userRole = req.user.role?.name?.toLowerCase();
    const userId = req.user.id;

    if (userRole === 'parent') {
      // Find parent by user ID first, then get their invoices
      return this.invoicesService.findByParentUserId(userId);
    } else if (userRole === 'student') {
      // Find student by user ID first, then get their invoices
      return this.invoicesService.findByStudentUserId(userId);
    }

    return [];
  }

  @Get('generate-number')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Generate a new invoice number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice number generated successfully',
  })
  generateInvoiceNumber() {
    return this.invoicesService.generateInvoiceNumber();
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: Invoice,
  })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(+id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: Invoice,
  })
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(+id, updateInvoiceDto);
  }

  @Patch(':id/mark-paid')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice marked as paid successfully',
    type: Invoice,
  })
  markAsPaid(
    @Param('id') id: string,
    @Body() body: { paymentMethod: string; transactionId?: string },
  ) {
    return this.invoicesService.markAsPaid(
      +id,
      body.paymentMethod,
      body.transactionId,
    );
  }

  @Patch(':id/upload-proof')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Upload payment proof for invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment proof uploaded successfully',
    type: Invoice,
  })
  uploadPaymentProof(
    @Param('id') id: string,
    @Body() body: { paymentProofUrl: string },
  ) {
    return this.invoicesService.uploadPaymentProof(+id, body.paymentProofUrl);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Invoice deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(+id);
  }
}
