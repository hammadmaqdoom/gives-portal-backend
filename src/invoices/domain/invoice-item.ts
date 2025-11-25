import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
