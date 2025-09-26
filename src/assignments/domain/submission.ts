import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../students/domain/student';
import { Assignment } from './assignment';

export enum SubmissionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  LATE = 'late',
}

export class Submission {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: SubmissionStatus.SUBMITTED })
  status: SubmissionStatus;

  @ApiProperty({ example: 85 })
  score?: number | null;

  @ApiProperty({ example: 'A' })
  grade?: string | null;

  @ApiProperty({ example: 'Great work! Well done on the analysis.' })
  comments?: string | null;

  @ApiProperty({ example: 'submission.pdf' })
  fileUrl?: string | null;

  @ApiProperty({ example: ['submission.pdf', 'additional_work.docx'] })
  attachments?: string[] | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  submittedAt?: Date | null;

  @ApiProperty({ example: '2024-01-16T14:00:00.000Z' })
  gradedAt?: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;

  student?: Student | null;
  assignment?: Assignment | null;
  class?: { id: number } | null;
}
