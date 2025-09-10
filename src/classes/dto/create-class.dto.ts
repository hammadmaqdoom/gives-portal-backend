import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateClassScheduleDto } from './class-schedule.dto';

class IdParamDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class CreateClassDto {
  @ApiProperty({ example: 'Advanced Mathematics 101' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Aug 2025 – April 2026' })
  @IsNotEmpty()
  @IsString()
  batchTerm: string;

  @ApiProperty({
    example: ['Tuesday', 'Thursday'],
    description: 'Legacy field - will be deprecated',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weekdays?: string[];

  @ApiProperty({
    example: '8:00PM–10:00PM',
    description: 'Legacy field - will be deprecated',
  })
  @IsOptional()
  @IsString()
  timing?: string;

  @ApiProperty({
    example: 'Asia/Karachi',
    description: 'Default timezone for the class',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    type: [CreateClassScheduleDto],
    description: 'Detailed schedule for each day',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClassScheduleDto)
  schedules?: CreateClassScheduleDto[];

  @ApiProperty({
    example: 'Advanced mathematics course covering calculus and algebra',
  })
  @IsOptional()
  @IsString()
  courseOutline?: string;

  @ApiProperty({ example: 150.0 })
  @IsNotEmpty()
  @IsNumber()
  feeUSD: number;

  @ApiProperty({ example: 42000.0 })
  @IsNotEmpty()
  @IsNumber()
  feePKR: number;

  @ApiProperty({ example: 'virtual', enum: ['virtual', 'in-person'] })
  @IsNotEmpty()
  @IsIn(['virtual', 'in-person'])
  classMode: 'virtual' | 'in-person';

  @ApiProperty({ type: IdParamDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => IdParamDto)
  subject: IdParamDto;

  @ApiProperty({ type: IdParamDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => IdParamDto)
  teacher: IdParamDto;
}
