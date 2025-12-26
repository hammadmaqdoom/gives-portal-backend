import { ApiProperty } from '@nestjs/swagger';

export class BulkClassesResultDto {
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
        className: 'Advanced Math 101',
        status: 'success',
        message: 'Class created successfully',
        classId: 1,
      },
      {
        row: 2,
        className: 'Biology Basics',
        status: 'error',
        message: 'Subject ID 999 not found',
      },
    ],
  })
  results: Array<{
    row: number;
    className: string;
    status: 'success' | 'error' | 'skipped';
    message: string;
    classId?: number;
  }>;
}

