import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkCreateClassItemDto {
  @ApiProperty({ example: 'Advanced Mathematics 101' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Aug 2025 – April 2026' })
  @IsNotEmpty()
  @IsString()
  batchTerm: string;

  @ApiProperty({ example: 1, description: 'Subject ID' })
  @IsNotEmpty()
  @IsNumber()
  subjectId: number;

  @ApiProperty({ example: 1, description: 'Teacher ID' })
  @IsNotEmpty()
  @IsNumber()
  teacherId: number;

  @ApiProperty({ example: 150.0 })
  @IsNotEmpty()
  @IsNumber()
  feeUSD: number;

  @ApiProperty({ example: 42000.0 })
  @IsNotEmpty()
  @IsNumber()
  feePKR: number;

  @ApiProperty({ example: 'virtual', enum: ['virtual', 'in-person', 'hybrid'] })
  @IsNotEmpty()
  @IsIn(['virtual', 'in-person', 'hybrid'])
  classMode: 'virtual' | 'in-person' | 'hybrid';

  @ApiProperty({ example: ['Tuesday', 'Thursday'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weekdays?: string[];

  @ApiProperty({ example: '8:00PM–10:00PM', required: false })
  @IsOptional()
  @IsString()
  timing?: string;

  @ApiProperty({ example: 'Asia/Karachi', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 'Advanced mathematics course', required: false })
  @IsOptional()
  @IsString()
  courseOutline?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isPublicForSale?: boolean;

  @ApiProperty({
    example: 'https://example.com/thumbnail.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}

export class BulkCreateClassesDto {
  @ApiProperty({
    type: [BulkCreateClassItemDto],
    description: 'Array of classes to create',
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateClassItemDto)
  classes: BulkCreateClassItemDto[];

  @ApiProperty({
    enum: ['skip', 'update'],
    default: 'skip',
    description: 'How to handle duplicates: skip or update',
    required: false,
  })
  @IsOptional()
  @IsIn(['skip', 'update'])
  duplicateHandling?: 'skip' | 'update';
}
