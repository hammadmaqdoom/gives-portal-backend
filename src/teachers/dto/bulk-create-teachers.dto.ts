import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsNotEmpty, IsNumber, IsString, IsOptional, IsEmail, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkCreateTeacherItemDto {
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

  @ApiProperty({ example: [1, 2], description: 'Array of subject IDs' })
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  subjectsAllowed: number[];

  @ApiProperty({ example: 'bank_transfer', required: false })
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

  @ApiProperty({ example: 'uuid-of-photo-file', required: false })
  @IsOptional()
  @IsString()
  photo?: string | null;

  @ApiProperty({ example: 'Experienced educator...', required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class BulkCreateTeachersDto {
  @ApiProperty({
    type: [BulkCreateTeacherItemDto],
    description: 'Array of teachers to create',
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateTeacherItemDto)
  teachers: BulkCreateTeacherItemDto[];
}

