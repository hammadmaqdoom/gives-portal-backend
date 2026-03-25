import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceItem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  invoiceId: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  classId?: number;

  @ApiPropertyOptional()
  className?: string;

  @ApiPropertyOptional()
  teacherName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
