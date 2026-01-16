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
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { InvoicePaymentService } from './invoice-payment.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
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
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoicePaymentService: InvoicePaymentService,
  ) {}

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

    console.log('🔍 getMyInvoices - User ID:', userId);
    console.log('🔍 getMyInvoices - User Role:', userRole);
    console.log(
      '🔍 getMyInvoices - Full user object:',
      JSON.stringify(req.user, null, 2),
    );

    if (userRole === 'parent') {
      // Find parent by user ID first, then get their invoices
      console.log('🔍 Getting invoices for parent with user ID:', userId);
      const result = await this.invoicesService.findByParentUserId(userId);
      console.log('🔍 Parent invoices result:', result);
      return result;
    } else if (userRole === 'student' || userRole === 'user') {
      // Find student by user ID first, then get their invoices
      console.log('🔍 Getting invoices for student with user ID:', userId);
      const result = await this.invoicesService.findByStudentUserId(userId);
      console.log('🔍 Student invoices result:', result);
      return result;
    }

    console.log('🔍 User role not recognized, returning empty array');
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

  @Post(':id/approve-payment')
  @Roles(RoleEnum.admin)
  @ApiOperation({
    summary: 'Approve bank transfer payment and activate enrollments',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment approved and enrollments activated successfully',
    type: Invoice,
  })
  async approvePayment(@Param('id') id: string) {
    const invoice = await this.invoicesService.findById(+id);
    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    // Mark invoice as paid
    const updatedInvoice = await this.invoicesService.markAsPaid(
      +id,
      'bank_transfer',
      undefined,
    );

    if (!updatedInvoice) {
      throw new BadRequestException('Failed to update invoice');
    }

    // Activate enrollments
    await this.invoicePaymentService.activateEnrollmentsForInvoice(
      updatedInvoice,
    );

    return updatedInvoice;
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

  @Post(':id/upload-proof-file')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload payment proof file for invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment proof file uploaded successfully',
    type: Invoice,
  })
  async uploadPaymentProofFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type (only allow PDF, images)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF and image files are allowed.',
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 10MB.',
      );
    }

    return this.invoicesService.uploadPaymentProofFile(+id, file, req.user?.id);
  }

  @Get(':id/pdf')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Download invoice as PDF' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice PDF generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async downloadPDF(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.invoicesService.generatePDF(+id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  }

  @Get(':id/view')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'View invoice as PDF' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice PDF generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async viewPDF(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.invoicesService.generatePDF(+id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  }

  @Post(':id/send-email')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send invoice via email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice sent via email successfully',
  })
  async sendInvoiceEmail(@Param('id') id: string) {
    return this.invoicesService.sendInvoiceEmail(+id);
  }

  @Delete('bulk')
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete multiple invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices deleted successfully',
  })
  removeMany(@Body() body: { ids: number[] }) {
    return this.invoicesService.removeMany(body.ids);
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
