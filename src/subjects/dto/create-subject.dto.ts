import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Advanced mathematics course', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '9709', required: false })
  @IsOptional()
  @IsString()
  syllabusCode?: string;

  @ApiProperty({ example: 'AS Level', required: false })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({
    example: 'https://www.cambridgeinternational.org/9709',
    required: false,
  })
  @IsOptional()
  @IsString()
  officialLink?: string;
}
