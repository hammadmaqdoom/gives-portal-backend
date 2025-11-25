import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus, PaymentMethod } from '../domain/fee';

export class CreateFeeDto {
  @ApiProperty({ example: 150.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: PaymentStatus.UNPAID })
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({ example: PaymentMethod.BANK_TRANSFER, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ example: 'TXN-2024-001', required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;

  @ApiProperty({
    example: 'Monthly fee for Mathematics class',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  student: { id: number };

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  class: { id: number };
}
