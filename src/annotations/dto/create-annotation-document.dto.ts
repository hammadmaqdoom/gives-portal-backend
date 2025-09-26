import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsObject, IsNumber, IsOptional } from 'class-validator';

export class CreateAnnotationDocumentDto {
  @ApiProperty({ example: 'submission-123' })
  @IsNotEmpty()
  @IsString()
  submissionId: string;

  @ApiProperty({ example: 'file-456' })
  @IsNotEmpty()
  @IsString()
  fileId: string;

  @ApiProperty({ 
    example: [
      {
        pageNumber: 1,
        annotations: [
          {
            id: 'annotation-1',
            type: 'highlight',
            pageNumber: 1,
            position: { x: 100, y: 100, width: 200, height: 20 },
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            createdBy: 'teacher-123',
            color: '#ffff00',
            opacity: 0.5,
            text: 'Important text'
          }
        ]
      }
    ]
  })
  @IsArray()
  @IsObject({ each: true })
  layers: any[];
}
