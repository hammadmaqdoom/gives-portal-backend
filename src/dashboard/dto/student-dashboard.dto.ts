import { ApiProperty } from '@nestjs/swagger';

export class StudentStatsDto {
  @ApiProperty({ example: 5 })
  enrolledClasses: number;

  @ApiProperty({ example: 96.5 })
  attendanceRate: number;

  @ApiProperty({ example: 87.2 })
  averageGrade: number;

  @ApiProperty({ example: 3 })
  pendingAssignments: number;

  @ApiProperty({ example: 28 })
  completedAssignments: number;

  @ApiProperty({ example: 'paid' })
  feeStatus: string;
}

export class GradeProgressDto {
  @ApiProperty({ example: 'Mathematics' })
  subject: string;

  @ApiProperty({ example: 88 })
  grade: number;
}

export class AttendanceCalendarDto {
  @ApiProperty({ example: '2024-01-15' })
  date: string;

  @ApiProperty({ example: true })
  present: boolean;
}

export class AssignmentStatusDto {
  @ApiProperty({ example: 'Math Quiz' })
  assignment: string;

  @ApiProperty({ example: 'completed' })
  status: string;

  @ApiProperty({ example: 90, required: false })
  grade?: number;
}

export class StudentAnalyticsDto {
  @ApiProperty({ type: [GradeProgressDto] })
  gradeProgress: GradeProgressDto[];

  @ApiProperty({ type: [AttendanceCalendarDto] })
  attendanceCalendar: AttendanceCalendarDto[];

  @ApiProperty({ type: [AssignmentStatusDto] })
  assignmentStatus: AssignmentStatusDto[];
}
