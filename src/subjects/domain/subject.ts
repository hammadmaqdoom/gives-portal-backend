import { ApiProperty } from '@nestjs/swagger';

export class Subject {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Mathematics' })
  name: string;

  @ApiProperty({ example: 'Advanced mathematics course' })
  description?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;
}
