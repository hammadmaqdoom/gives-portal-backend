import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentResponseDto } from './enrollment.dto';

export class StudentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  contact?: string;

  @ApiPropertyOptional()
  photo?: any;

  @ApiPropertyOptional()
  user?: any;

  @ApiPropertyOptional({
    description:
      'Whether the student has granted biometric (face-recognition) consent.',
  })
  biometricConsent?: boolean;

  @ApiPropertyOptional({ description: 'When consent was last granted/revoked.' })
  biometricConsentAt?: Date | null;

  @ApiPropertyOptional({
    description: 'User id of the admin/guardian who recorded consent.',
  })
  biometricConsentBy?: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [EnrollmentResponseDto] })
  enrollments?: EnrollmentResponseDto[];

  @ApiPropertyOptional({ type: [Object] })
  parents?: any[];
}

export class StudentWithDetailsResponseDto extends StudentResponseDto {
  @ApiProperty({ type: [EnrollmentResponseDto] })
  enrollments: EnrollmentResponseDto[];

  @ApiProperty({ type: [Object] })
  parents: any[];
}
