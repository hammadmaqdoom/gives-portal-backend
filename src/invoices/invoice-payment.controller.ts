import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { InvoicePaymentService } from './invoice-payment.service';
import { PaymentTransaction } from '../payments/domain/payment-transaction';

@ApiTags('Invoice Payments')
@Controller('invoices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class InvoicePaymentController {
  constructor(private invoicePaymentService: InvoicePaymentService) {}

  @Post(':id/payment-session')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Create payment session for invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment session created successfully',
  })
  async createPaymentSession(
    @Param('id') invoiceId: string,
    @Body()
    body: {
      gatewayId: number;
      customerInfo?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
      };
    },
  ): Promise<{
    sessionToken: string;
    authToken: string;
    checkoutUrl: string;
    transactionId: string;
  }> {
    return this.invoicePaymentService.createPaymentSession(
      +invoiceId,
      body.gatewayId,
      body.customerInfo,
    );
  }

  @Get(':id/payment-history')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get payment history for invoice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment history retrieved successfully',
    type: [PaymentTransaction],
  })
  async getInvoicePaymentHistory(
    @Param('id') invoiceId: string,
  ): Promise<PaymentTransaction[]> {
    return this.invoicePaymentService.getInvoicePaymentHistory(+invoiceId);
  }

  @Get('my-payment-history')
  @Roles(RoleEnum.user)
  @ApiOperation({ summary: 'Get my payment history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment history retrieved successfully',
  })
  async getMyPaymentHistory(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    data: PaymentTransaction[];
    meta: any;
  }> {
    const studentId = req.user?.id;
    if (!studentId) {
      throw new Error('Student ID not found in request');
    }

    return this.invoicePaymentService.getStudentPaymentHistory(studentId, {
      page,
      limit,
      status,
      startDate,
      endDate,
    });
  }

  @Get('payment-statistics')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment statistics retrieved successfully',
  })
  @ApiQuery({
    name: 'studentId',
    required: false,
    description: 'Filter by student ID',
  })
  async getPaymentStatistics(@Query('studentId') studentId?: number): Promise<{
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
    totalRefunded: number;
    recentTransactions: PaymentTransaction[];
  }> {
    return this.invoicePaymentService.getPaymentStatistics(studentId);
  }

  @Post(':id/refund')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Refund invoice payment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment refunded successfully',
    type: PaymentTransaction,
  })
  async refundInvoicePayment(
    @Param('id') invoiceId: string,
    @Body() body: { amount?: number; reason?: string },
  ): Promise<PaymentTransaction> {
    return this.invoicePaymentService.refundInvoicePayment(
      +invoiceId,
      body.amount,
      body.reason,
    );
  }
}
