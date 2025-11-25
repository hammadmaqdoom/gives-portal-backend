import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

export class CreateEnrollmentDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsString()
  classId: number;

  @ApiPropertyOptional({ example: 'active', enum: EnrollmentStatus })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;
}

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({ example: 'active', enum: EnrollmentStatus })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;
}

export class EnrollmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  studentId: number;

  @ApiProperty()
  classId: number;

  @ApiProperty()
  enrollmentDate: Date;

  @ApiProperty({ enum: EnrollmentStatus })
  status: EnrollmentStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  class?: any;

  @ApiPropertyOptional()
  student?: any;
}
