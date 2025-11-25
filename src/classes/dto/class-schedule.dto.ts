import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Weekday } from '../infrastructure/persistence/relational/entities/class-schedule.entity';

export class CreateClassScheduleDto {
  @ApiProperty({ enum: Weekday, example: Weekday.MONDAY })
  @IsNotEmpty()
  @IsEnum(Weekday)
  weekday: Weekday;

  @ApiProperty({
    example: '09:00',
    description: 'Start time in 24-hour format (HH:MM)',
  })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({
    example: '10:30',
    description: 'End time in 24-hour format (HH:MM)',
  })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiProperty({
    example: 'America/New_York',
    description: 'IANA timezone identifier',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: '2024-01-15',
    description: 'When this schedule becomes effective',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'When this schedule expires',
  })
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiProperty({ example: 'Additional notes for this schedule' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateClassScheduleDto {
  @ApiProperty({ enum: Weekday, example: Weekday.MONDAY })
  @IsOptional()
  @IsEnum(Weekday)
  weekday?: Weekday;

  @ApiProperty({
    example: '09:00',
    description: 'Start time in 24-hour format (HH:MM)',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({
    example: '10:30',
    description: 'End time in 24-hour format (HH:MM)',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({
    example: 'America/New_York',
    description: 'IANA timezone identifier',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: '2024-01-15',
    description: 'When this schedule becomes effective',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'When this schedule expires',
  })
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiProperty({ example: 'Additional notes for this schedule' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkCreateClassSchedulesDto {
  @ApiProperty({ type: [CreateClassScheduleDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClassScheduleDto)
  schedules: CreateClassScheduleDto[];
}
