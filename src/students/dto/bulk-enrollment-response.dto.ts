import { ApiProperty } from '@nestjs/swagger';

export class BulkEnrollmentResultDto {
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
        studentName: 'John Doe',
        status: 'success',
        message: 'Student and parent created successfully',
      },
      {
        row: 2,
        studentName: 'Jane Smith',
        status: 'error',
        message: 'Class ID 123 not found',
      },
    ],
  })
  results: Array<{
    row: number;
    studentName: string;
    status: 'success' | 'error' | 'skipped';
    message: string;
    studentId?: number;
    parentIds?: number[];
    classIds?: number[];
  }>;
}

