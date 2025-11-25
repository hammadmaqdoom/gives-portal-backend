import { ApiProperty } from '@nestjs/swagger';
import { InvoiceItem } from './invoice-item';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  ONLINE = 'online',
  CREDIT_CARD = 'credit_card',
}

export class Invoice {
  @ApiProperty()
  id: number;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  studentId: number;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  parentId?: number;

  @ApiProperty()
  parentName?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: InvoiceStatus;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  generatedDate: Date;

  @ApiProperty()
  paidDate?: Date;

  @ApiProperty()
  paymentMethod?: PaymentMethod;

  @ApiProperty()
  transactionId?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  paymentProofUrl?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt?: Date;

  @ApiProperty({ type: [InvoiceItem] })
  items?: InvoiceItem[];
}
