import { ZoomCredentials } from '../../../../domain/zoom-credentials';
import { ZoomCredentialsEntity } from '../entities/zoom-credentials.entity';

export class ZoomCredentialsMapper {
  static toDomain(raw: ZoomCredentialsEntity): ZoomCredentials {
    const zoomCredentials = new ZoomCredentials();
    zoomCredentials.id = raw.id;
    zoomCredentials.teacherId = raw.teacherId;
    zoomCredentials.zoomApiKey = raw.zoomApiKey;
    zoomCredentials.zoomApiSecret = raw.zoomApiSecret;
    zoomCredentials.zoomAccountId = raw.zoomAccountId;
    zoomCredentials.zoomWebhookSecret = raw.zoomWebhookSecret;
    zoomCredentials.isActive = raw.isActive;
    zoomCredentials.createdAt = raw.createdAt;
    zoomCredentials.updatedAt = raw.updatedAt;
    return zoomCredentials;
  }

  static toPersistence(
    domain: ZoomCredentials,
  ): Partial<ZoomCredentialsEntity> {
    return {
      id: domain.id,
      teacherId: domain.teacherId,
      zoomApiKey: domain.zoomApiKey,
      zoomApiSecret: domain.zoomApiSecret,
      zoomAccountId: domain.zoomAccountId,
      zoomWebhookSecret: domain.zoomWebhookSecret,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
