import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePerformanceDto {
  @ApiProperty({ example: 85 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({
    example: 'Excellent work! Good understanding of the concepts.',
    required: false,
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ example: 'A', required: false })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  submittedAt?: Date;

  @ApiProperty({ example: '2024-01-16T14:00:00.000Z', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  gradedAt?: Date;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  student: { id: number };

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  assignment: { id: number };
}
