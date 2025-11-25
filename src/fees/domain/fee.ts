import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../students/domain/student';
import { Class } from '../../classes/domain/class';

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CHECK = 'check',
  ONLINE = 'online',
}

export class Fee {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 150.0 })
  amount: number;

  @ApiProperty({ example: PaymentStatus.PAID })
  status: PaymentStatus;

  @ApiProperty({ example: PaymentMethod.BANK_TRANSFER })
  paymentMethod?: PaymentMethod | null;

  @ApiProperty({ example: 'TXN-2024-001' })
  transactionId?: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  dueDate: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', required: false })
  paidAt?: Date | null;

  @ApiProperty({ example: 'Monthly fee for Mathematics class' })
  description?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;

  student?: Student | null;
  class?: Class | null;
}
