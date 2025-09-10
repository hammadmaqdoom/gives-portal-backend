import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsDate,
  Min,
  IsEnum,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Fee, PaymentStatus } from '../domain/fee';

export class FilterFeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDateTo?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidDateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidDateTo?: Date;
}

export class SortFeeDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  orderBy: keyof Fee;

  @ApiProperty()
  @IsString()
  order: string;
}

export class QueryFeeDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) =>
    value ? plainToInstance(FilterFeeDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterFeeDto)
  filters?: FilterFeeDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => {
    return value ? plainToInstance(SortFeeDto, JSON.parse(value)) : undefined;
  })
  @ValidateNested({ each: true })
  @Type(() => SortFeeDto)
  sort?: SortFeeDto[] | null;
}
