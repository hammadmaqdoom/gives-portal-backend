import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FilterStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRelations?: boolean;
}

export class SortStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC';
}

export class QueryStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => FilterStudentDto)
  filters?: FilterStudentDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => SortStudentDto)
  sort?: SortStudentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRelations?: boolean;
}
