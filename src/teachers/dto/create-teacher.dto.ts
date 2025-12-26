import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({ example: 'Dr. Sarah Johnson' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'sarah.johnson@school.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 15.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercentage: number;

  @ApiProperty({
    example: [1, 2],
    description: 'Array of subject IDs that this teacher is allowed to teach',
  })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  subjectsAllowed: number[];

  @ApiProperty({
    example: 'bank_transfer',
    enum: ['bank_transfer', 'cash', 'check', 'online'],
    required: false,
  })
  @IsOptional()
  @IsString()
  payoutMethod?: string;

  @ApiProperty({ example: 'HBL Bank', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ example: 'HBLPKKA', required: false })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiProperty({ example: 'PK36SCBL0000001123456702', required: false })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiProperty({ example: 'Main Branch, Karachi', required: false })
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiProperty({
    example: 'uuid-of-photo-file',
    description: 'File ID for the teacher photo',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string | null;

  @ApiProperty({
    example:
      'Experienced educator with over 10 years of teaching mathematics and physics.',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    example: false,
    description: 'Whether this teacher should be shown on the public website',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  showOnPublicSite?: boolean;

  @ApiProperty({
    example: 0,
    description: 'Display order for public website',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
