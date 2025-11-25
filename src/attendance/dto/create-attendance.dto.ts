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
import { AttendanceStatus } from '../domain/attendance';

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
}
