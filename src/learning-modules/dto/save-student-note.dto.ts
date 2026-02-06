import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveStudentNoteDto {
  @ApiProperty({ description: 'Module ID' })
  @IsNumber()
  moduleId: number;

  @ApiProperty({ description: 'Student ID' })
  @IsNumber()
  studentId: number;

  @ApiProperty({ description: 'Note content', required: false })
  @IsString()
  @IsOptional()
  noteContent?: string | null;
}
