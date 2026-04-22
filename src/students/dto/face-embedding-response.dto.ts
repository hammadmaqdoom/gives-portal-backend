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

  @ApiPropertyOptional({ example: 'b3a4c1d2-0000-4000-8000-000000000001' })
  sourceFileId?: string | null;

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

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether the student has granted biometric consent. Frontend UIs should hide/disable enrollment when false.',
  })
  biometricConsent?: boolean;

  @ApiPropertyOptional({
    example: '2026-04-22T10:00:00.000Z',
    description: 'When consent was last granted or revoked.',
  })
  biometricConsentAt?: Date | null;
}

export class ClassFaceEmbeddingsResponseDto {
  @ApiProperty({ example: 7 })
  classId: number;

  @ApiProperty({ type: [ClassFaceEmbeddingsStudentDto] })
  students: ClassFaceEmbeddingsStudentDto[];
}
