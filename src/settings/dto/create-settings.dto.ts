import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEmail,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateSettingsDto {
  @ApiProperty({ example: 'LMS Portal' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  appName: string;

  @ApiProperty({ example: 'LMS Portal - Education Management System' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  appTitle: string;

  @ApiProperty({
    example:
      'Comprehensive education management system for schools and institutions',
  })
  @IsNotEmpty()
  @IsString()
  metaDescription: string;

  @ApiPropertyOptional({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsOptional()
  @IsString()
  logoNavbar?: string;

  @ApiPropertyOptional({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsOptional()
  @IsString()
  logoFavicon?: string;

  @ApiPropertyOptional({ example: 'Asia/Karachi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  defaultTimezone?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Karachi, Pakistan' })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({ example: 'NTN' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  taxRegistrationLabel?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxRegistrationNumber?: string;

  @ApiPropertyOptional({ example: 'COMP-2024-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyNumber?: string;

  @ApiPropertyOptional({ example: 'LMS Education Pvt Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyLegalName?: string;

  @ApiPropertyOptional({
    example: 'PKR',
    description: 'ISO 4217 currency code used as default across the company',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  defaultCurrency?: string;

  @ApiPropertyOptional({ example: 'Habib Bank Limited' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890123456' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'LMS Education Pvt Ltd' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountTitle?: string;

  @ApiPropertyOptional({ example: 'Current' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccountType?: string;

  @ApiPropertyOptional({ example: 'PKR' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccountCurrency?: string;

  @ApiPropertyOptional({ example: 'HABBPKKA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankRoutingNumber?: string;

  @ApiPropertyOptional({ example: 'PK36HABB0001234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankIban?: string;

  @ApiPropertyOptional({ example: 'HABBPKKA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankSwiftCode?: string;

  @ApiPropertyOptional({ example: 'smtp.gmail.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @ApiPropertyOptional({ example: 'noreply@lmsportal.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpUser?: string;

  @ApiPropertyOptional({ example: 'your-smtp-password' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpPassword?: string;

  @ApiPropertyOptional({ example: 'noreply@lmsportal.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  smtpFromEmail?: string;

  @ApiPropertyOptional({ example: 'LMS Portal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpFromName?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  smtpIgnoreTls?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  smtpRequireTls?: boolean;

  @ApiPropertyOptional({ example: '+92-21-1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'info@lmsportal.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'https://lmsportal.com' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  contactWebsite?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/lmsportal' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  socialFacebook?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/lmsportal' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  socialTwitter?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/lmsportal' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  socialLinkedin?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/lmsportal' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  socialInstagram?: string;

  // File Storage
  @ApiPropertyOptional({
    example: 'local',
    description: 'local | s3 | s3-presigned | azure-blob-sas',
  })
  @IsOptional()
  @IsString()
  fileDriver?: string;

  // AWS S3
  @ApiPropertyOptional({ example: 'AKIA...' })
  @IsOptional()
  @IsString()
  accessKeyId?: string;

  @ApiPropertyOptional({ example: '********' })
  @IsOptional()
  @IsString()
  secretAccessKey?: string;

  @ApiPropertyOptional({ example: 'my-bucket-name' })
  @IsOptional()
  @IsString()
  awsDefaultS3Bucket?: string;

  @ApiPropertyOptional({ example: 'ap-south-1' })
  @IsOptional()
  @IsString()
  awsS3Region?: string;

  // Azure Blob (SAS)
  @ApiPropertyOptional({ example: 'mystorage' })
  @IsOptional()
  @IsString()
  azureStorageAccountName?: string;

  @ApiPropertyOptional({ example: '********' })
  @IsOptional()
  @IsString()
  azureStorageAccountKey?: string;

  @ApiPropertyOptional({ example: 'container-name' })
  @IsOptional()
  @IsString()
  azureContainerName?: string;

  @ApiPropertyOptional({ example: 3600 })
  @IsOptional()
  @IsNumber()
  azureBlobSasExpirySeconds?: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com' })
  @IsOptional()
  @IsString()
  azureBlobPublicBaseUrl?: string;

  // Backblaze B2
  @ApiPropertyOptional({ example: 'https://s3.us-west-001.backblazeb2.com' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  b2EndpointUrl?: string;

  @ApiPropertyOptional({ example: 'us-west-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  b2Region?: string;

  // SMS Configuration
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ example: 'branded_sms_pakistan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  smsProvider?: string;

  @ApiPropertyOptional({ example: 'digitaro.co.global@gmail.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  smsApiEmail?: string;

  @ApiPropertyOptional({ example: '1005dbcac3c1899ff30f63bbc2443a573a' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smsApiKey?: string;

  @ApiPropertyOptional({ example: 'H3 TEST SMS' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  smsMask?: string;

  @ApiPropertyOptional({ example: 'https://secure.h3techs.com/sms/api/send' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  smsApiUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  smsTestMode?: boolean;

  // WhatsApp Configuration
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @ApiPropertyOptional({ example: 'DEVICE_ID' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  whatsappDeviceId?: string;

  @ApiPropertyOptional({
    example: 'https://secure.h3techs.com/sms/api/send_whatsapp',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  whatsappApiUrl?: string;

  // Theme Configuration
  @ApiPropertyOptional({
    example: 'brand',
    description:
      'Theme color preset: default, brand, cyan, purple, blue, orange, red, custom',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  themeColorPreset?: string;

  @ApiPropertyOptional({
    example: '#00C7AB',
    description:
      'Custom theme color in hex format (only used when themeColorPreset is "custom")',
  })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  themeCustomColor?: string;
}
