import { ApiProperty } from '@nestjs/swagger';

export class Subject {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Mathematics' })
  name: string;

  @ApiProperty({ example: 'Advanced mathematics course' })
  description?: string | null;

  @ApiProperty({ example: '9709', required: false })
  syllabusCode?: string | null;

  @ApiProperty({ example: 'AS Level', required: false })
  level?: string | null;

  @ApiProperty({
    example: 'https://www.cambridgeinternational.org/9709',
    required: false,
  })
  officialLink?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;
}
