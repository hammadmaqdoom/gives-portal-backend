import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'settings',
})
export class SettingsEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  // App Information
  @Column({ type: 'varchar', length: 255 })
  appName: string;

  @Column({ type: 'varchar', length: 255 })
  appTitle: string;

  @Column({ type: 'text' })
  metaDescription: string;

  // Logo and Images
  @Column({ type: 'text', nullable: true })
  logoNavbar: string | null; // Base64 or URL

  @Column({ type: 'text', nullable: true })
  logoFavicon: string | null; // Base64 or URL

  // Business Information
  @Column({ type: 'varchar', length: 100, default: 'Asia/Karachi' })
  defaultTimezone: string;

  @Column({ type: 'text', nullable: true })
  businessAddress: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  taxRegistrationLabel: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  taxRegistrationNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  companyNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyLegalName: string | null;

  // Bank Account Details
  @Column({ type: 'varchar', length: 3, nullable: true, default: 'PKR' })
  defaultCurrency: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bankName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankAccountNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankAccountTitle: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bankAccountType: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bankAccountCurrency: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankRoutingNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankIban: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankSwiftCode: string | null;

  // SMTP Configuration
  @Column({ type: 'varchar', length: 255, nullable: true })
  smtpHost: string | null;

  @Column({ type: 'integer', nullable: true })
  smtpPort: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smtpUser: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smtpPassword: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smtpFromEmail: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smtpFromName: string | null;

  @Column({ type: 'boolean', default: false })
  smtpSecure: boolean;

  @Column({ type: 'boolean', default: false })
  smtpIgnoreTls: boolean;

  @Column({ type: 'boolean', default: false })
  smtpRequireTls: boolean;

  // Contact Information
  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactWebsite: string | null;

  // Social Media
  @Column({ type: 'varchar', length: 255, nullable: true })
  socialFacebook: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  socialTwitter: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  socialLinkedin: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  socialInstagram: string | null;

  // File Storage Configuration
  @Column({ type: 'varchar', length: 32, nullable: true, default: 'local' })
  fileDriver: string | null; // local | s3 | s3-presigned | azure-blob-sas | b2 | b2-presigned

  // AWS S3
  @Column({ type: 'varchar', length: 255, nullable: true })
  accessKeyId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secretAccessKey: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  awsDefaultS3Bucket: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  awsS3Region: string | null;

  // Azure Blob (SAS)
  @Column({ type: 'varchar', length: 255, nullable: true })
  azureStorageAccountName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  azureStorageAccountKey: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  azureContainerName: string | null;

  @Column({ type: 'integer', nullable: true })
  azureBlobSasExpirySeconds: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  azureBlobPublicBaseUrl: string | null;

  // Backblaze B2
  @Column({ type: 'varchar', length: 500, nullable: true })
  b2EndpointUrl: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  b2Region: string | null;

  // SMS Configuration
  @Column({ type: 'boolean', default: false })
  smsEnabled: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  smsProvider: string | null; // 'branded_sms_pakistan' | 'other'

  @Column({ type: 'varchar', length: 255, nullable: true })
  smsApiEmail: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smsApiKey: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  smsMask: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  smsApiUrl: string | null;

  @Column({ type: 'boolean', default: true })
  smsTestMode: boolean;

  // WhatsApp Configuration
  @Column({ type: 'boolean', default: false })
  whatsappEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  whatsappDeviceId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  whatsappApiUrl: string | null;

  // Theme Configuration
  @Column({ type: 'varchar', length: 50, nullable: true, default: 'brand' })
  themeColorPreset: string | null; // 'default' | 'brand' | 'cyan' | 'purple' | 'blue' | 'orange' | 'red' | 'custom'

  @Column({ type: 'varchar', length: 7, nullable: true })
  themeCustomColor: string | null; // Hex color code (e.g., #00C7AB)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
