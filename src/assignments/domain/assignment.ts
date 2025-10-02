import { ApiProperty } from '@nestjs/swagger';
import { Class } from '../../classes/domain/class';
import { Teacher } from '../../teachers/domain/teacher';

export enum AssignmentType {
  ASSIGNMENT = 'assignment',
  EXAM = 'exam',
  QUIZ = 'quiz',
  PROJECT = 'project',
  ACTIVITY = 'activity',
  PRACTICE = 'practice',
}

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
}

export class Assignment {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Mathematics Assignment 1' })
  title: string;

  @ApiProperty({ example: '<p>Complete exercises 1-10 from Chapter 3</p>' })
  description?: string | null;

  @ApiProperty({ example: '2024-01-20T23:59:59.000Z' })
  dueDate: Date;

  @ApiProperty({ example: AssignmentType.ASSIGNMENT })
  type: AssignmentType;

  @ApiProperty({ example: AssignmentStatus.DRAFT })
  status: AssignmentStatus;

  @ApiProperty({ example: 100 })
  maxScore?: number | null;

  @ApiProperty({
    example:
      '<p>Grading criteria: Content (40%), Presentation (30%), Timeliness (30%)</p>',
  })
  markingCriteria?: string | null;

  @ApiProperty({ example: ['assignment.pdf', 'rubric.docx'] })
  attachments?: string[] | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;

  class?: Class | null;
  teacher?: Teacher | null;
}
