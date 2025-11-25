import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsDto {
  @ApiProperty({ example: 1234 })
  totalStudents: number;

  @ApiProperty({ example: 1180 })
  activeStudents: number;

  @ApiProperty({ example: 32 })
  totalTeachers: number;

  @ApiProperty({ example: 48 })
  totalClasses: number;

  @ApiProperty({ example: 856 })
  totalParents: number;

  @ApiProperty({ example: 125000 })
  totalRevenue: number;

  @ApiProperty({ example: 12340 })
  pendingFees: number;

  @ApiProperty({ example: 94.5 })
  averageAttendance: number;

  @ApiProperty({ example: 12 })
  recentEnrollments: number;

  @ApiProperty({ example: 8 })
  recentPayments: number;
}

export class EnrollmentTrendDto {
  @ApiProperty({ example: 'Jan' })
  month: string;

  @ApiProperty({ example: 45 })
  enrollments: number;
}

export class RevenueAnalyticsDto {
  @ApiProperty({ example: 'Jan' })
  month: string;

  @ApiProperty({ example: 15000 })
  revenue: number;
}

export class AttendanceByClassDto {
  @ApiProperty({ example: 'Grade 10A' })
  class: string;

  @ApiProperty({ example: 96 })
  attendance: number;
}

export class TeacherPerformanceDto {
  @ApiProperty({ example: 'Dr. Smith' })
  teacher: string;

  @ApiProperty({ example: 4.8 })
  rating: number;
}

export class AdminAnalyticsDto {
  @ApiProperty({ type: [EnrollmentTrendDto] })
  enrollmentTrends: EnrollmentTrendDto[];

  @ApiProperty({ type: [RevenueAnalyticsDto] })
  revenueAnalytics: RevenueAnalyticsDto[];

  @ApiProperty({ type: [AttendanceByClassDto] })
  attendanceByClass: AttendanceByClassDto[];

  @ApiProperty({ type: [TeacherPerformanceDto] })
  teacherPerformance: TeacherPerformanceDto[];
}
