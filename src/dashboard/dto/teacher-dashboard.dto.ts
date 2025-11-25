import { ApiProperty } from '@nestjs/swagger';

export class TeacherStatsDto {
  @ApiProperty({ example: 6 })
  myClasses: number;

  @ApiProperty({ example: 142 })
  totalStudents: number;

  @ApiProperty({ example: 94.2 })
  averageAttendance: number;

  @ApiProperty({ example: 8 })
  pendingAssignments: number;

  @ApiProperty({ example: 45 })
  completedAssignments: number;

  @ApiProperty({ example: 85.5 })
  averageGrade: number;
}

export class ClassAttendanceDto {
  @ApiProperty({ example: 'Mathematics 10A' })
  class: string;

  @ApiProperty({ example: 96 })
  attendance: number;
}

export class StudentPerformanceDto {
  @ApiProperty({ example: 'John Doe' })
  student: string;

  @ApiProperty({ example: 88 })
  grade: number;
}

export class AssignmentStatusDto {
  @ApiProperty({ example: 'Algebra Quiz' })
  assignment: string;

  @ApiProperty({ example: 18 })
  submitted: number;

  @ApiProperty({ example: 20 })
  total: number;
}

export class TeacherAnalyticsDto {
  @ApiProperty({ type: [ClassAttendanceDto] })
  classAttendance: ClassAttendanceDto[];

  @ApiProperty({ type: [StudentPerformanceDto] })
  studentPerformance: StudentPerformanceDto[];

  @ApiProperty({ type: [AssignmentStatusDto] })
  assignmentStatus: AssignmentStatusDto[];
}
