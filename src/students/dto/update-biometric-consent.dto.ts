import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Grant or revoke a student's biometric (facial-recognition) consent.
 * The caller's identity + request metadata is captured in the audit log so
 * we can prove who authorised enrollment during a later compliance review.
 */
export class UpdateBiometricConsentDto {
  @ApiProperty({
    example: true,
    description:
      'true to grant consent (unlocks face-embedding enrollment), false to revoke (also wipes enrolled samples).',
  })
  @IsBoolean()
  consent: boolean;

  @ApiPropertyOptional({
    example: 'Guardian signed on-paper consent form 2026-04-22',
    description:
      'Free-form note captured alongside the consent event. Stored in audit log; keep any PII minimal.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
