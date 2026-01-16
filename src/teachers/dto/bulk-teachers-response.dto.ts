import { ApiProperty } from '@nestjs/swagger';

export class BulkTeachersResultDto {
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
        teacherName: 'Dr. Smith',
        status: 'success',
        message: 'Teacher created successfully',
        teacherId: 1,
        tempPassword: 'abc123xyz',
      },
      {
        row: 2,
        teacherName: 'Prof. Khan',
        status: 'error',
        message: 'Email already exists',
      },
    ],
  })
  results: Array<{
    row: number;
    teacherName: string;
    status: 'success' | 'error' | 'skipped';
    message: string;
    teacherId?: number;
    tempPassword?: string;
  }>;
}
