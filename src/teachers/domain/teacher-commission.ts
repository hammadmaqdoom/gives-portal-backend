import { ApiProperty } from '@nestjs/swagger';
import { Teacher } from './teacher';
import { Class } from '../../classes/domain/class';
import { Student } from '../../students/domain/student';

export enum CommissionStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export class TeacherCommission {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 150.0 })
  amount: number;

  @ApiProperty({ example: 15.5 })
  commissionPercentage: number;

  @ApiProperty({ example: 23.25 })
  commissionAmount: number;

  @ApiProperty({ example: CommissionStatus.PENDING })
  status: CommissionStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  dueDate: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', required: false })
  paidAt?: Date | null;

  @ApiProperty({ example: 'Monthly commission for Mathematics class' })
  description?: string | null;

  @ApiProperty({ example: 'TXN-COMM-2024-001' })
  transactionId?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;

  teacher?: Teacher | null;
  class?: Class | null;
  student?: Student | null;
}
