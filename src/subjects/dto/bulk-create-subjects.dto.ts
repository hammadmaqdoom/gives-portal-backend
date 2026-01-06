import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkCreateSubjectItemDto {
  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Advanced mathematics course', required: false })
  description?: string;

  @ApiProperty({ example: 'MATH101', required: false })
  syllabusCode?: string;

  @ApiProperty({ example: 'High School', required: false })
  level?: string;

  @ApiProperty({ example: 'https://example.com/syllabus', required: false })
  officialLink?: string;
}

export class BulkCreateSubjectsDto {
  @ApiProperty({
    type: [BulkCreateSubjectItemDto],
    description: 'Array of subjects to create',
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateSubjectItemDto)
  subjects: BulkCreateSubjectItemDto[];
}
