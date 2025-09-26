import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPositive, IsString, IsUrl } from 'class-validator';

export class UploadProofDto {
  @ApiProperty()
  @IsPositive()
  studentId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentProofUrl: string; // Allow generic string; can switch to IsUrl if needed
}
