import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { CommissionStatus } from '../domain/teacher-commission';

export class FilterTeacherCommissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  teacherId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  classId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  studentId?: number;

  @ApiPropertyOptional({ enum: CommissionStatus })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class SortTeacherCommissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderBy?: keyof FilterTeacherCommissionDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order?: string;
}
