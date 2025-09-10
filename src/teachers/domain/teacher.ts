import { ApiProperty } from '@nestjs/swagger';

export class Teacher {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Dr. Smith' })
  name: string;

  @ApiProperty({ example: 'dr.smith@example.com' })
  email?: string | null;

  @ApiProperty({ example: '+1234567890' })
  phone?: string | null;

  @ApiProperty({ example: 15.5 })
  commissionPercentage: number;

  @ApiProperty({
    example: [1, 2],
    description: 'Array of subject IDs that this teacher is allowed to teach',
  })
  subjectsAllowed: number[];

  @ApiProperty({
    example: 'bank_transfer',
    enum: ['bank_transfer', 'cash', 'check', 'online'],
  })
  payoutMethod?: string | null;

  @ApiProperty({ example: 'HBL Bank' })
  bankName?: string | null;

  @ApiProperty({ example: '1234567890' })
  accountNumber?: string | null;

  @ApiProperty({ example: 'HBLPKKA' })
  bankCode?: string | null;

  @ApiProperty({ example: 'PK36SCBL0000001123456702' })
  iban?: string | null;

  @ApiProperty({ example: 'John Doe' })
  accountHolderName?: string | null;

  @ApiProperty({ example: 'Main Branch, Karachi' })
  bankBranch?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;
}
