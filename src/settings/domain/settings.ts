import { ApiProperty } from '@nestjs/swagger';

export class Settings {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'LMS Portal' })
  appName: string;

  @ApiProperty({ example: 'LMS Portal - Education Management System' })
  appTitle: string;

  @ApiProperty({ example: 'Comprehensive education management system for schools and institutions' })
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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
