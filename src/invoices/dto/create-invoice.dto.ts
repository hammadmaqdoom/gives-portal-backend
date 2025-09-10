import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InvoiceStatus, PaymentMethod } from '../domain/invoice';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: 'Monthly tuition fee for Mathematics' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => Number(value) || 1)
  quantity: number;

  @ApiProperty({ example: 100.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value) || 0)
  unitPrice: number;

  @ApiProperty({ example: 100.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value) || 0)
  total: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'INV-2024-001' })
  @IsNotEmpty()
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  studentId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ example: 100.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value) || 0)
  amount: number;

  @ApiProperty({ example: 'USD', enum: ['USD', 'PKR'] })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({ example: 'draft', enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiProperty({ example: '2024-12-31' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 'Monthly tuition fee for January 2024' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'Additional notes about the invoice' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateInvoiceItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}
