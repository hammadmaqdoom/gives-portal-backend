import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FileUploadDto {
  @ApiProperty({ example: 'image.jpg' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 138723 })
  @IsNumber()
  fileSize: number;

  @ApiPropertyOptional({
    example: 'assignment',
    description: 'Logical type/folder',
  })
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional({
    example: '123',
    description: 'Context identifier subfolder',
  })
  @IsOptional()
  @IsString()
  contextId?: string;
}
