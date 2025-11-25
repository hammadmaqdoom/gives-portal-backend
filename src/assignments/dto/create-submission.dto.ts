import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { SubmissionStatus } from '../domain/submission';

export class CreateSubmissionDto {
  @ApiProperty({ example: SubmissionStatus.SUBMITTED })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @ApiProperty({ example: 85, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiProperty({ example: 'A', required: false })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiProperty({
    example: 'Great work! Well done on the analysis.',
    required: false,
    description: 'Comments from teacher or student',
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({
    example: 'submission.pdf',
    required: false,
    description: 'Main submission file URL',
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({
    example: ['submission.pdf', 'additional_work.docx'],
    required: false,
    description: 'Array of file URLs for additional attachments',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  student: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  assignment: number;
}
