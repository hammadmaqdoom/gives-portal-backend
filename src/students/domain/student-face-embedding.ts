import { ApiProperty } from '@nestjs/swagger';

export class StudentFaceEmbedding {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 42 })
  studentId: number;

  @ApiProperty({
    description:
      'Face descriptor vector (128 floats) computed by face-api.js in the browser.',
    type: [Number],
  })
  embedding: number[];

  @ApiProperty({ example: 'face-api.js@1.7.14/ssd_mobilenetv1' })
  modelName: string;

  @ApiProperty({ example: 0.98, required: false })
  qualityScore?: number | null;

  @ApiProperty({
    example: 'b3a4c1d2-0000-4000-8000-000000000001',
    required: false,
  })
  sourceFileId?: string | null;

  @ApiProperty({ example: '2026-04-22T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-22T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null, required: false })
  deletedAt?: Date | null;
}
