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
  @Transform(({ value }) =>
    value ? plainToInstance(FilterClassDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterClassDto)
  filters?: FilterClassDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => {
    return value ? plainToInstance(SortClassDto, JSON.parse(value)) : undefined;
  })
  @ValidateNested({ each: true })
  @Type(() => SortClassDto)
  sort?: SortClassDto[] | null;
}
