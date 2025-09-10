import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Performance } from '../domain/performance';

export class FilterPerformanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignmentTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  scoreMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  scoreMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  submittedFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  submittedTo?: Date;
}

export class SortPerformanceDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  orderBy: keyof Performance;

  @ApiProperty()
  @IsString()
  order: string;
}

export class QueryPerformanceDto {
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
    value
      ? plainToInstance(FilterPerformanceDto, JSON.parse(value))
      : undefined,
  )
  @ValidateNested()
  @Type(() => FilterPerformanceDto)
  filters?: FilterPerformanceDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => {
    return value
      ? plainToInstance(SortPerformanceDto, JSON.parse(value))
      : undefined;
  })
  @ValidateNested({ each: true })
  @Type(() => SortPerformanceDto)
  sort?: SortPerformanceDto[] | null;
}
