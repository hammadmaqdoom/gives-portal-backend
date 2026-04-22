import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FaceEmbeddingSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 42 })
  studentId: number;

  @ApiProperty({ example: 'face-api.js@1.7.14/ssd_mobilenetv1' })
  modelName: string;

  @ApiPropertyOptional({ example: 0.98 })
  qualityScore?: number | null;

  @ApiPropertyOptional({ example: 321 })
  sourceFileId?: number | null;

  @ApiProperty({ example: '2026-04-22T10:00:00.000Z' })
  createdAt: Date;
}

export class ClassFaceEmbeddingsStudentDto {
  @ApiProperty({ example: 42 })
  studentId: number;

  @ApiProperty({ example: 'Ahmed Khan' })
  name: string;

  @ApiPropertyOptional({ example: 'STU-0042' })
  studentCode?: string | null;

  @ApiPropertyOptional({
    example:
      'https://cdn.lumus-lms.example/files/42/photo.jpg',
  })
  photoUrl?: string | null;

  @ApiProperty({
    description:
      'All active face descriptors for this student. Each descriptor is an array of 128 floats. Empty array means not enrolled.',
    example: [[0.12, -0.03, 0.98, '...128 floats']],
  })
  embeddings: number[][];

  @ApiProperty({ example: 'face-api.js@1.7.14/ssd_mobilenetv1' })
  modelName: string;
}

export class ClassFaceEmbeddingsResponseDto {
  @ApiProperty({ example: 7 })
  classId: number;

  @ApiProperty({ type: [ClassFaceEmbeddingsStudentDto] })
  students: ClassFaceEmbeddingsStudentDto[];
}
