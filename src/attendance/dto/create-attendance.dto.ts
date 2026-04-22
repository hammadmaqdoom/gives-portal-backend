import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceMatchedBy, AttendanceStatus } from '../domain/attendance';

export class CreateAttendanceDto {
  @ApiProperty({ example: '2024-01-15' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ example: AttendanceStatus.PRESENT })
  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({
    example: 'Student was present and participated well',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  student: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  class: number;

  @ApiProperty({
    example: AttendanceMatchedBy.MANUAL,
    required: false,
    description: 'How the attendance row was captured.',
  })
  @IsOptional()
  @IsEnum(AttendanceMatchedBy)
  matchedBy?: AttendanceMatchedBy;

  @ApiProperty({
    example: 0.32,
    required: false,
    description:
      'Squared-distance between the live descriptor and the best-matching enrolled descriptor (only meaningful when matchedBy=face). Lower = higher confidence. Persisted to the audit log, not the attendance row.',
  })
  @IsOptional()
  @IsNumber()
  matchDistance?: number;

  @ApiProperty({
    example: 'face-api.js@1.7.14/tiny+landmark68+recognition',
    required: false,
    description:
      'Identifier of the model/version that produced the match (only meaningful when matchedBy=face).',
  })
  @IsOptional()
  @IsString()
  matchModelName?: string;
}
