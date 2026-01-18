import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Class } from '../domain/class';

export class FilterClassDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timing?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  teacherId?: number;
}

export class SortClassDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  orderBy: keyof Class;

  @ApiProperty()
  @IsString()
  order: string;
}

export class QueryClassDto {
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
  @Transform(({ value }) => {
    if (!value || value === '{}' || value === 'null') return undefined;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed ? plainToInstance(FilterClassDto, parsed) : undefined;
      } catch {
        return undefined;
      }
    }
    return plainToInstance(FilterClassDto, value);
  })
  @ValidateNested()
  @Type(() => FilterClassDto)
  filters?: FilterClassDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || value === '[]' || value === 'null') return undefined;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed && Array.isArray(parsed) && parsed.length > 0
          ? plainToInstance(SortClassDto, parsed)
          : undefined;
      } catch {
        return undefined;
      }
    }
    return Array.isArray(value) && value.length > 0
      ? plainToInstance(SortClassDto, value)
      : undefined;
  })
  @ValidateNested({ each: true })
  @Type(() => SortClassDto)
  sort?: SortClassDto[] | null;
}
