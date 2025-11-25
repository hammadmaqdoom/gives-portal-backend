import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
  IsDate,
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Assignment, AssignmentType } from '../domain/assignment';

export class FilterAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  className?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(AssignmentType)
  type?: AssignmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDateTo?: Date;
}

export class SortAssignmentDto {
  @ApiProperty()
  @Type(() => String)
  @IsString()
  orderBy: keyof Assignment;

  @ApiProperty()
  @IsString()
  order: string;
}

export class QueryAssignmentDto {
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
    value ? plainToInstance(FilterAssignmentDto, JSON.parse(value)) : undefined,
  )
  @ValidateNested()
  @Type(() => FilterAssignmentDto)
  filters?: FilterAssignmentDto | null;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @Transform(({ value }) => {
    return value
      ? plainToInstance(SortAssignmentDto, JSON.parse(value))
      : undefined;
  })
  @ValidateNested({ each: true })
  @Type(() => SortAssignmentDto)
  sort?: SortAssignmentDto[] | null;
}
