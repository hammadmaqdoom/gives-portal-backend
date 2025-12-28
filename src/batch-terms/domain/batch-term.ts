import { ApiProperty } from '@nestjs/swagger';

export class BatchTerm {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Aug 2025 – April 2026' })
  name: string;

  @ApiProperty({ example: 'Academic year 2025-2026', required: false })
  description?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  displayOrder: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null })
  deletedAt: Date | null;
}

