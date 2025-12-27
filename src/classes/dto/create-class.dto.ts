import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateClassScheduleDto } from './class-schedule.dto';

class IdParamDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class CreateClassDto {
  @ApiProperty({ example: 'Advanced Mathematics 101' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Aug 2025 – April 2026' })
  @IsNotEmpty()
  @IsString()
  batchTerm: string;

  @ApiProperty({
    example: ['Tuesday', 'Thursday'],
    description: 'Legacy field - will be deprecated',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weekdays?: string[];

  @ApiProperty({
    example: '8:00PM–10:00PM',
    description: 'Legacy field - will be deprecated',
  })
  @IsOptional()
  @IsString()
  timing?: string;

  @ApiProperty({
    example: 'Asia/Karachi',
    description: 'Default timezone for the class',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    type: [CreateClassScheduleDto],
    description: 'Detailed schedule for each day',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClassScheduleDto)
  schedules?: CreateClassScheduleDto[];

  @ApiProperty({
    example: 'Advanced mathematics course covering calculus and algebra',
  })
  @IsOptional()
  @IsString()
  courseOutline?: string;

  @ApiProperty({ example: 150.0 })
  @IsNotEmpty()
  @IsNumber()
  feeUSD: number;

  @ApiProperty({ example: 42000.0 })
  @IsNotEmpty()
  @IsNumber()
  feePKR: number;

  @ApiProperty({ example: 'virtual', enum: ['virtual', 'in-person'] })
  @IsNotEmpty()
  @IsIn(['virtual', 'in-person'])
  classMode: 'virtual' | 'in-person';

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsIn([true, false])
  isPublicForSale?: boolean;

  @ApiProperty({ example: 'https://example.com/thumbnail.jpg', required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false, description: 'File ID for thumbnail image' })
  @IsOptional()
  @IsUUID()
  thumbnailFileId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', required: false, description: 'File ID for cover image' })
  @IsOptional()
  @IsUUID()
  coverImageFileId?: string;

  @ApiProperty({
    example: { duration: '3 months', level: 'Beginner', format: 'Online' },
    required: false,
  })
  @IsOptional()
  features?: any;

  @ApiProperty({ type: IdParamDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => IdParamDto)
  subject: IdParamDto;

  @ApiProperty({ type: IdParamDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => IdParamDto)
  teacher: IdParamDto;
}
