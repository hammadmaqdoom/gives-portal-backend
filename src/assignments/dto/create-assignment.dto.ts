import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssignmentType, AssignmentStatus } from '../domain/assignment';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Mathematics Assignment 1' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: '<p>Complete exercises 1-10 from Chapter 3</p>',
    required: false,
    description: 'WYSIWYG content for assignment description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-01-20T23:59:59.000Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @ApiProperty({ example: AssignmentType.ASSIGNMENT })
  @IsNotEmpty()
  @IsEnum(AssignmentType)
  type: AssignmentType;

  @ApiProperty({
    example: AssignmentStatus.DRAFT,
    required: false,
    description: 'Assignment status (draft, published, closed)',
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @ApiProperty({
    example:
      '<p>Grading criteria: Content (40%), Presentation (30%), Timeliness (30%)</p>',
    required: false,
    description: 'WYSIWYG content for marking criteria',
  })
  @IsOptional()
  @IsString()
  markingCriteria?: string;

  @ApiProperty({
    example: ['assignment.pdf', 'rubric.docx'],
    required: false,
    description: 'Array of file URLs attached to the assignment',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  class: number;
}
