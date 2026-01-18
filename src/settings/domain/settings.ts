import { ApiProperty } from '@nestjs/swagger';

export class Settings {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'LMS Portal' })
  appName: string;

  @ApiProperty({ example: 'LMS Portal - Education Management System' })
  appTitle: string;

  @ApiProperty({
    example:
      'Comprehensive education management system for schools and institutions',
  })
  metaDescription: string;

  @ApiProperty({ example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' })
  logoNavbar?: string | null;

  @ApiProperty({ example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' })
  logoFavicon?: string | null;

  @ApiProperty({ example: 'Asia/Karachi' })
  defaultTimezone: string;

  @ApiProperty({ example: '123 Main Street, Karachi, Pakistan' })
  businessAddress?: string | null;

  @ApiProperty({ example: 'NTN' })
  taxRegistrationLabel?: string | null;

  @ApiProperty({ example: '1234567890123' })
  taxRegistrationNumber?: string | null;

  @ApiProperty({ example: 'COMP-2024-001' })
  companyNumber?: string | null;

  @ApiProperty({ example: 'LMS Education Pvt Ltd' })
  companyLegalName?: string | null;

  @ApiProperty({ example: 'Habib Bank Limited' })
  bankName?: string | null;

  @ApiProperty({ example: '1234567890123456' })
  bankAccountNumber?: string | null;

  @ApiProperty({ example: 'LMS Education Pvt Ltd' })
  bankAccountTitle?: string | null;

  @ApiProperty({ example: 'Current' })
  bankAccountType?: string | null;

  @ApiProperty({ example: 'PKR' })
  bankAccountCurrency?: string | null;

  @ApiProperty({ example: 'HABBPKKA' })
  bankRoutingNumber?: string | null;

  @ApiProperty({ example: 'PK36HABB0001234567890123' })
  bankIban?: string | null;

  @ApiProperty({ example: 'HABBPKKA' })
  bankSwiftCode?: string | null;

  @ApiProperty({ example: 'smtp.gmail.com' })
  smtpHost?: string | null;

  @ApiProperty({ example: 587 })
  smtpPort?: number | null;

  @ApiProperty({ example: 'noreply@lmsportal.com' })
  smtpUser?: string | null;

  @ApiProperty({ example: 'your-smtp-password' })
  smtpPassword?: string | null;

  @ApiProperty({ example: 'noreply@lmsportal.com' })
  smtpFromEmail?: string | null;

  @ApiProperty({ example: 'LMS Portal' })
  smtpFromName?: string | null;

  @ApiProperty({ example: false })
  smtpSecure: boolean;

  @ApiProperty({ example: false })
  smtpIgnoreTls: boolean;

  @ApiProperty({ example: true })
  smtpRequireTls: boolean;

  @ApiProperty({ example: '+92-21-1234567' })
  contactPhone?: string | null;

  @ApiProperty({ example: 'info@lmsportal.com' })
  contactEmail?: string | null;

  @ApiProperty({ example: 'https://lmsportal.com' })
  contactWebsite?: string | null;

  @ApiProperty({ example: 'https://facebook.com/lmsportal' })
  socialFacebook?: string | null;

  @ApiProperty({ example: 'https://twitter.com/lmsportal' })
  socialTwitter?: string | null;

  @ApiProperty({ example: 'https://linkedin.com/company/lmsportal' })
  socialLinkedin?: string | null;

  @ApiProperty({ example: 'https://instagram.com/lmsportal' })
  socialInstagram?: string | null;

  // SMS Configuration
  @ApiProperty({ example: false })
  smsEnabled: boolean;

  @ApiProperty({ example: 'branded_sms_pakistan' })
  smsProvider?: string | null;

  @ApiProperty({ example: 'digitaro.co.global@gmail.com' })
  smsApiEmail?: string | null;

  @ApiProperty({ example: '1005dbcac3c1899ff30f63bbc2443a573a' })
  smsApiKey?: string | null;

  @ApiProperty({ example: 'H3 TEST SMS' })
  smsMask?: string | null;

  @ApiProperty({ example: 'https://secure.h3techs.com/sms/api/send' })
  smsApiUrl?: string | null;

  @ApiProperty({ example: true })
  smsTestMode: boolean;

  // WhatsApp Configuration
  @ApiProperty({ example: false })
  whatsappEnabled: boolean;

  @ApiProperty({ example: 'DEVICE_ID' })
  whatsappDeviceId?: string | null;

  @ApiProperty({ example: 'https://secure.h3techs.com/sms/api/send_whatsapp' })
  whatsappApiUrl?: string | null;

  // File Storage Configuration
  @ApiProperty({ example: 'local' })
  fileDriver?: string | null;

  // AWS S3
  @ApiProperty({ example: 'AKIA...' })
  accessKeyId?: string | null;

  @ApiProperty({ example: '********' })
  secretAccessKey?: string | null;

  @ApiProperty({ example: 'my-bucket-name' })
  awsDefaultS3Bucket?: string | null;

  @ApiProperty({ example: 'ap-south-1' })
  awsS3Region?: string | null;

  // Azure Blob (SAS)
  @ApiProperty({ example: 'mystorage' })
  azureStorageAccountName?: string | null;

  @ApiProperty({ example: '********' })
  azureStorageAccountKey?: string | null;

  @ApiProperty({ example: 'container-name' })
  azureContainerName?: string | null;

  @ApiProperty({ example: 3600 })
  azureBlobSasExpirySeconds?: number | null;

  @ApiProperty({ example: 'https://cdn.example.com' })
  azureBlobPublicBaseUrl?: string | null;

  // Backblaze B2
  @ApiProperty({ example: 'https://s3.us-west-001.backblazeb2.com' })
  b2EndpointUrl?: string | null;

  @ApiProperty({ example: 'us-west-001' })
  b2Region?: string | null;

  // Theme Configuration
  @ApiProperty({ example: 'brand' })
  themeColorPreset?: string | null;

  @ApiProperty({ example: '#00C7AB' })
  themeCustomColor?: string | null;

  // Zoom Configuration
  @ApiProperty({ example: 'your_zoom_client_id' })
  zoomClientId?: string | null;

  @ApiProperty({ example: 'your_zoom_client_secret' })
  zoomClientSecret?: string | null;

  @ApiProperty({ example: false })
  zoomAdminAccess: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
