import { ApiProperty } from '@nestjs/swagger';

export class BulkSubjectsResultDto {
  @ApiProperty({ example: 10 })
  totalRows: number;

  @ApiProperty({ example: 8 })
  successful: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({
    example: [
      {
        row: 1,
        name: 'Mathematics',
        status: 'success',
        message: 'Subject created successfully',
        subjectId: 1,
      },
      {
        row: 2,
        name: 'Physics',
        status: 'error',
        message: 'Subject name already exists',
      },
    ],
  })
  results: Array<{
    row: number;
    name: string;
    status: 'success' | 'error' | 'skipped';
    message: string;
    subjectId?: number;
  }>;
}

