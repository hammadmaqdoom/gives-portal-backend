import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../students/domain/student';
import { Class } from '../../classes/domain/class';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export class Attendance {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2024-01-15' })
  date: Date;

  @ApiProperty({ example: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @ApiProperty({ example: 'Student was present and participated well' })
  notes?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;

  student?: Student | null;
  class?: Class | null;
}
