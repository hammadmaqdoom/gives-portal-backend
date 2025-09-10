import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Subject } from '../domain/subject';

export class FilterSubjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class SortSubjectDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  orderBy: keyof Subject;

  @ApiProperty()
  @IsString()
  order: string;
}

export class QuerySubjectDto {
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
    value ? plainToInstance(FilterSubjectDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterSubjectDto)
  filters?: FilterSubjectDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => {
    return value
      ? plainToInstance(SortSubjectDto, JSON.parse(value))
      : undefined;
  })
  @ValidateNested({ each: true })
  @Type(() => SortSubjectDto)
  sort?: SortSubjectDto[] | null;
}
