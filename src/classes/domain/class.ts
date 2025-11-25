import { ApiProperty } from '@nestjs/swagger';
import { Subject } from '../../subjects/domain/subject';
import { Teacher } from '../../teachers/domain/teacher';
import { ClassSchedule } from './class-schedule';

export class Class {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Mathematics 101' })
  name: string;

  @ApiProperty({ example: 'Aug 2025 – April 2026' })
  batchTerm: string;

  @ApiProperty({
    example: ['Tuesday', 'Thursday'],
    description: 'Legacy field - will be deprecated',
  })
  weekdays?: string[];

  @ApiProperty({
    example: '8:00PM–10:00PM',
    description: 'Legacy field - will be deprecated',
  })
  timing?: string;

  @ApiProperty({
    example: 'Asia/Karachi',
    description: 'Default timezone for the class',
  })
  timezone?: string;

  @ApiProperty({
    example: 'Advanced mathematics course covering algebra and calculus',
  })
  courseOutline?: string | null;

  @ApiProperty({ example: 150.0 })
  feeUSD: number;

  @ApiProperty({ example: 42000.0 })
  feePKR: number;

  @ApiProperty({ example: 'virtual', enum: ['virtual', 'in-person'] })
  classMode: 'virtual' | 'in-person';

  @ApiProperty({
    type: [ClassSchedule],
    description: 'Detailed schedule for each day',
  })
  schedules?: ClassSchedule[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;

  subject?: Subject | null;
  teacher?: Teacher | null;
}
