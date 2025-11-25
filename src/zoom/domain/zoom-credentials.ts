export class ZoomCredentials {
  id: number;
  teacherId: number;
  zoomApiKey: string;
  zoomApiSecret: string;
  zoomAccountId: string;
  zoomWebhookSecret?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateZoomCredentialsDto {
  teacherId: number;
  zoomApiKey: string;
  zoomApiSecret: string;
  zoomAccountId: string;
  zoomWebhookSecret?: string;
}

export interface UpdateZoomCredentialsDto {
  zoomApiKey?: string;
  zoomApiSecret?: string;
  zoomAccountId?: string;
  zoomWebhookSecret?: string;
  isActive?: boolean;
}
