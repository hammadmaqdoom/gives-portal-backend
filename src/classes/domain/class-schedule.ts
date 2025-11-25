import { ApiProperty } from '@nestjs/swagger';

export enum Weekday {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export class ClassSchedule {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  classId: number;

  @ApiProperty({ enum: Weekday, example: Weekday.MONDAY })
  weekday: Weekday;

  @ApiProperty({
    example: '09:00',
    description: 'Start time in 24-hour format (HH:MM)',
  })
  startTime: string;

  @ApiProperty({
    example: '10:30',
    description: 'End time in 24-hour format (HH:MM)',
  })
  endTime: string;

  @ApiProperty({
    example: 'Asia/Karachi',
    description: 'IANA timezone identifier',
  })
  timezone: string;

  @ApiProperty({ example: true, default: true })
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-15',
    description: 'When this schedule becomes effective',
  })
  effectiveFrom?: Date;

  @ApiProperty({
    example: '2024-12-31',
    description: 'When this schedule expires',
  })
  effectiveUntil?: Date;

  @ApiProperty({ example: 'Additional notes for this schedule' })
  notes?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;
}
