import { Settings } from '../../../../domain/settings';
import { SettingsEntity } from '../entities/settings.entity';

export class SettingsMapper {
  static toDomain(raw: SettingsEntity): Settings {
    const domainEntity = new Settings();
    domainEntity.id = raw.id;
    domainEntity.appName = raw.appName;
    domainEntity.appTitle = raw.appTitle;
    domainEntity.metaDescription = raw.metaDescription;
    domainEntity.logoNavbar = raw.logoNavbar;
    domainEntity.logoFavicon = raw.logoFavicon;
    domainEntity.defaultTimezone = raw.defaultTimezone;
    domainEntity.businessAddress = raw.businessAddress;
    domainEntity.taxRegistrationLabel = raw.taxRegistrationLabel;
    domainEntity.taxRegistrationNumber = raw.taxRegistrationNumber;
    domainEntity.companyNumber = raw.companyNumber;
    domainEntity.companyLegalName = raw.companyLegalName;
    domainEntity.bankName = raw.bankName;
    domainEntity.bankAccountNumber = raw.bankAccountNumber;
    domainEntity.bankAccountTitle = raw.bankAccountTitle;
    domainEntity.bankAccountType = raw.bankAccountType;
    domainEntity.bankAccountCurrency = raw.bankAccountCurrency;
    domainEntity.bankRoutingNumber = raw.bankRoutingNumber;
    domainEntity.bankIban = raw.bankIban;
    domainEntity.bankSwiftCode = raw.bankSwiftCode;
    domainEntity.smtpHost = raw.smtpHost;
    domainEntity.smtpPort = raw.smtpPort;
    domainEntity.smtpUser = raw.smtpUser;
    domainEntity.smtpPassword = raw.smtpPassword;
    domainEntity.smtpFromEmail = raw.smtpFromEmail;
    domainEntity.smtpFromName = raw.smtpFromName;
    domainEntity.smtpSecure = raw.smtpSecure;
    domainEntity.smtpIgnoreTls = raw.smtpIgnoreTls;
    domainEntity.smtpRequireTls = raw.smtpRequireTls;
    domainEntity.contactPhone = raw.contactPhone;
    domainEntity.contactEmail = raw.contactEmail;
    domainEntity.contactWebsite = raw.contactWebsite;
    domainEntity.socialFacebook = raw.socialFacebook;
    domainEntity.socialTwitter = raw.socialTwitter;
    domainEntity.socialLinkedin = raw.socialLinkedin;
    domainEntity.socialInstagram = raw.socialInstagram;
    domainEntity.smsEnabled = raw.smsEnabled;
    domainEntity.smsProvider = raw.smsProvider;
    domainEntity.smsApiEmail = raw.smsApiEmail;
    domainEntity.smsApiKey = raw.smsApiKey;
    domainEntity.smsMask = raw.smsMask;
    domainEntity.smsApiUrl = raw.smsApiUrl;
    domainEntity.smsTestMode = raw.smsTestMode;
    domainEntity.whatsappEnabled = raw.whatsappEnabled;
    domainEntity.whatsappDeviceId = raw.whatsappDeviceId;
    domainEntity.whatsappApiUrl = raw.whatsappApiUrl;
    // File Storage Configuration
    domainEntity.fileDriver = raw.fileDriver;
    domainEntity.accessKeyId = raw.accessKeyId;
    domainEntity.secretAccessKey = raw.secretAccessKey;
    domainEntity.awsDefaultS3Bucket = raw.awsDefaultS3Bucket;
    domainEntity.awsS3Region = raw.awsS3Region;
    domainEntity.azureStorageAccountName = raw.azureStorageAccountName;
    domainEntity.azureStorageAccountKey = raw.azureStorageAccountKey;
    domainEntity.azureContainerName = raw.azureContainerName;
    domainEntity.azureBlobSasExpirySeconds = raw.azureBlobSasExpirySeconds;
    domainEntity.azureBlobPublicBaseUrl = raw.azureBlobPublicBaseUrl;
    domainEntity.themeColorPreset = raw.themeColorPreset;
    domainEntity.themeCustomColor = raw.themeCustomColor;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Settings): Partial<SettingsEntity> {
    const persistenceEntity = new SettingsEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.appName = domainEntity.appName;
    persistenceEntity.appTitle = domainEntity.appTitle;
    persistenceEntity.metaDescription = domainEntity.metaDescription;
    persistenceEntity.logoNavbar = domainEntity.logoNavbar || null;
    persistenceEntity.logoFavicon = domainEntity.logoFavicon || null;
    persistenceEntity.defaultTimezone = domainEntity.defaultTimezone;
    persistenceEntity.businessAddress = domainEntity.businessAddress || null;
    persistenceEntity.taxRegistrationLabel =
      domainEntity.taxRegistrationLabel || null;
    persistenceEntity.taxRegistrationNumber =
      domainEntity.taxRegistrationNumber || null;
    persistenceEntity.companyNumber = domainEntity.companyNumber || null;
    persistenceEntity.companyLegalName = domainEntity.companyLegalName || null;
    persistenceEntity.bankName = domainEntity.bankName || null;
    persistenceEntity.bankAccountNumber =
      domainEntity.bankAccountNumber || null;
    persistenceEntity.bankAccountTitle = domainEntity.bankAccountTitle || null;
    persistenceEntity.bankAccountType = domainEntity.bankAccountType || null;
    persistenceEntity.bankAccountCurrency =
      domainEntity.bankAccountCurrency || null;
    persistenceEntity.bankRoutingNumber =
      domainEntity.bankRoutingNumber || null;
    persistenceEntity.bankIban = domainEntity.bankIban || null;
    persistenceEntity.bankSwiftCode = domainEntity.bankSwiftCode || null;
    persistenceEntity.smtpHost = domainEntity.smtpHost || null;
    persistenceEntity.smtpPort = domainEntity.smtpPort || null;
    persistenceEntity.smtpUser = domainEntity.smtpUser || null;
    persistenceEntity.smtpPassword = domainEntity.smtpPassword || null;
    persistenceEntity.smtpFromEmail = domainEntity.smtpFromEmail || null;
    persistenceEntity.smtpFromName = domainEntity.smtpFromName || null;
    persistenceEntity.smtpSecure = domainEntity.smtpSecure;
    persistenceEntity.smtpIgnoreTls = domainEntity.smtpIgnoreTls;
    persistenceEntity.smtpRequireTls = domainEntity.smtpRequireTls;
    persistenceEntity.contactPhone = domainEntity.contactPhone || null;
    persistenceEntity.contactEmail = domainEntity.contactEmail || null;
    persistenceEntity.contactWebsite = domainEntity.contactWebsite || null;
    persistenceEntity.socialFacebook = domainEntity.socialFacebook || null;
    persistenceEntity.socialTwitter = domainEntity.socialTwitter || null;
    persistenceEntity.socialLinkedin = domainEntity.socialLinkedin || null;
    persistenceEntity.socialInstagram = domainEntity.socialInstagram || null;
    persistenceEntity.smsEnabled = domainEntity.smsEnabled;
    persistenceEntity.smsProvider = domainEntity.smsProvider || null;
    persistenceEntity.smsApiEmail = domainEntity.smsApiEmail || null;
    persistenceEntity.smsApiKey = domainEntity.smsApiKey || null;
    persistenceEntity.smsMask = domainEntity.smsMask || null;
    persistenceEntity.smsApiUrl = domainEntity.smsApiUrl || null;
    persistenceEntity.smsTestMode = domainEntity.smsTestMode;
    persistenceEntity.whatsappEnabled = domainEntity.whatsappEnabled;
    persistenceEntity.whatsappDeviceId = domainEntity.whatsappDeviceId || null;
    persistenceEntity.whatsappApiUrl = domainEntity.whatsappApiUrl || null;
    // File Storage Configuration
    persistenceEntity.fileDriver = domainEntity.fileDriver || null;
    persistenceEntity.accessKeyId = domainEntity.accessKeyId || null;
    persistenceEntity.secretAccessKey = domainEntity.secretAccessKey || null;
    persistenceEntity.awsDefaultS3Bucket =
      domainEntity.awsDefaultS3Bucket || null;
    persistenceEntity.awsS3Region = domainEntity.awsS3Region || null;
    persistenceEntity.azureStorageAccountName =
      domainEntity.azureStorageAccountName || null;
    persistenceEntity.azureStorageAccountKey =
      domainEntity.azureStorageAccountKey || null;
    persistenceEntity.azureContainerName =
      domainEntity.azureContainerName || null;
    persistenceEntity.azureBlobSasExpirySeconds =
      domainEntity.azureBlobSasExpirySeconds || null;
    persistenceEntity.azureBlobPublicBaseUrl =
      domainEntity.azureBlobPublicBaseUrl || null;
    persistenceEntity.themeColorPreset = domainEntity.themeColorPreset || null;
    persistenceEntity.themeCustomColor = domainEntity.themeCustomColor || null;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
