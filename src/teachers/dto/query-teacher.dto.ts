import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Teacher } from '../domain/teacher';

export class FilterTeacherDto {
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
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class SortTeacherDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  orderBy: keyof Teacher;

  @ApiProperty()
  @IsString()
  order: string;
}

export class QueryTeacherDto {
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
        return parsed ? plainToInstance(FilterTeacherDto, parsed) : undefined;
      } catch {
        return undefined;
      }
    }
    return plainToInstance(FilterTeacherDto, value);
  })
  @ValidateNested()
  @Type(() => FilterTeacherDto)
  filters?: FilterTeacherDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || value === '[]' || value === 'null') return undefined;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed && Array.isArray(parsed) && parsed.length > 0
          ? plainToInstance(SortTeacherDto, parsed)
          : undefined;
      } catch {
        return undefined;
      }
    }
    return Array.isArray(value) && value.length > 0
      ? plainToInstance(SortTeacherDto, value)
      : undefined;
  })
  @ValidateNested({ each: true })
  @Type(() => SortTeacherDto)
  sort?: SortTeacherDto[] | null;
}
