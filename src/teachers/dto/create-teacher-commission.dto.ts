import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';

export class IdParamDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class CreateTeacherCommissionDto {
  @ApiProperty({ example: 150.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 15.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  commissionPercentage: number;

  @ApiProperty({ example: 23.25 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  commissionAmount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    example: 'Monthly commission for Mathematics class',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: IdParamDto })
  @IsNotEmpty()
  teacher: IdParamDto;

  @ApiProperty({ type: IdParamDto })
  @IsNotEmpty()
  class: IdParamDto;

  @ApiProperty({ type: IdParamDto })
  @IsNotEmpty()
  student: IdParamDto;
}
