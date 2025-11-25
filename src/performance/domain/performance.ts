import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../students/domain/student';
import { Assignment } from '../../assignments/domain/assignment';

export class Performance {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 85 })
  score: number;

  @ApiProperty({
    example: 'Excellent work! Good understanding of the concepts.',
  })
  comments?: string | null;

  @ApiProperty({ example: 'A' })
  grade?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  submittedAt?: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  gradedAt?: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;

  student?: Student | null;
  assignment?: Assignment | null;
}
