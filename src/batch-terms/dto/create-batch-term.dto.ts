import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateBatchTermDto {
  @ApiProperty({ example: 'Aug 2025 – April 2026' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Academic year 2025-2026', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
