import { PartialType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { InvoiceStatus, PaymentMethod } from '../domain/invoice';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiPropertyOptional({ example: 'paid', enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @ApiPropertyOptional({ example: 'bank_transfer', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'TXN123456789' })
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'https://example.com/payment-proof.pdf' })
  @IsOptional()
  paymentProofUrl?: string;
}
