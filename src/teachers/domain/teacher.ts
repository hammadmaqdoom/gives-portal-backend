import { ApiProperty } from '@nestjs/swagger';
import { FileType, File } from '../../files/domain/file';

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

  @ApiProperty({ type: () => File, required: false })
  photo?: FileType | null;

  @ApiProperty({
    example:
      'Experienced educator with over 10 years of teaching mathematics and physics.',
    required: false,
  })
  bio?: string | null;

  @ApiProperty({
    example: false,
    description: 'Whether this teacher should be shown on the public website',
  })
  showOnPublicSite: boolean;

  @ApiProperty({
    example: 0,
    description: 'Display order for public website (lower numbers appear first)',
  })
  displayOrder: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;
}
