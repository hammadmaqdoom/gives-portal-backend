import { ApiProperty } from '@nestjs/swagger';

// Reuse from student dashboard
export class GradeProgressDto {
  @ApiProperty({ example: 'Mathematics' })
  subject: string;

  @ApiProperty({ example: 88 })
  grade: number;
}

export class ParentStatsDto {
  @ApiProperty({ example: 2 })
  childrenCount: number;

  @ApiProperty({ example: 95.5 })
  averageAttendance: number;

  @ApiProperty({ example: 450 })
  outstandingFees: number;

  @ApiProperty({ example: 3 })
  unreadMessages: number;

  @ApiProperty({ example: 2 })
  upcomingEvents: number;

  @ApiProperty({ example: 5 })
  recentPayments: number;
}

export class ChildPerformanceDto {
  @ApiProperty({ example: 'John Doe' })
  child: string;

  @ApiProperty({ example: 96 })
  attendance: number;

  @ApiProperty({ example: 88 })
  averageGrade: number;

  @ApiProperty({ type: [GradeProgressDto] })
  subjects: GradeProgressDto[];
}

export class FeeHistoryDto {
  @ApiProperty({ example: '2024-01-15' })
  date: string;

  @ApiProperty({ example: 500 })
  amount: number;

  @ApiProperty({ example: 'paid' })
  status: string;
}

export class ParentAnalyticsDto {
  @ApiProperty({ type: [ChildPerformanceDto] })
  childrenPerformance: ChildPerformanceDto[];

  @ApiProperty({ type: [FeeHistoryDto] })
  feeHistory: FeeHistoryDto[];
}
