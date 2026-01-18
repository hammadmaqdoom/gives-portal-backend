import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  CreateZoomCredentialsDto,
  UpdateZoomCredentialsDto,
  ZoomCredentials,
} from './domain/zoom-credentials';
import {
  CreateZoomMeetingDto,
  UpdateZoomMeetingDto,
  JoinZoomMeetingDto,
  ZoomMeeting,
} from './domain/zoom-meeting';
import { ZoomCredentialsRepository } from './infrastructure/persistence/zoom-credentials.repository';
import { ZoomMeetingRepository } from './infrastructure/persistence/zoom-meeting.repository';
import { SettingsService } from '../settings/settings.service';
import * as crypto from 'crypto';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);

  constructor(
    private readonly zoomCredentialsRepository: ZoomCredentialsRepository,
    private readonly zoomMeetingRepository: ZoomMeetingRepository,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
  ) {}

  // Encryption/Decryption methods for sensitive data
  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || 'default-key',
      'salt',
      32,
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY || 'default-key',
      'salt',
      32,
    );
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Zoom Credentials Management
  async createCredentials(
    createDto: CreateZoomCredentialsDto,
  ): Promise<ZoomCredentials> {
    // Check if teacher already has credentials
    const existing = await this.zoomCredentialsRepository.findByTeacherId(
      createDto.teacherId,
    );
    if (existing) {
      throw new BadRequestException('Teacher already has Zoom credentials');
    }

    // Encrypt sensitive data
    const encryptedCredentials = {
      ...createDto,
      zoomApiKey: this.encrypt(createDto.zoomApiKey),
      zoomApiSecret: this.encrypt(createDto.zoomApiSecret),
      zoomAccountId: this.encrypt(createDto.zoomAccountId),
      zoomWebhookSecret: createDto.zoomWebhookSecret
        ? this.encrypt(createDto.zoomWebhookSecret)
        : undefined,
      isActive: true,
    };

    const saved =
      await this.zoomCredentialsRepository.create(encryptedCredentials);

    // Return decrypted data for response (excluding secrets)
    return {
      ...saved,
      zoomApiKey: createDto.zoomApiKey,
      zoomApiSecret: '***HIDDEN***',
      zoomAccountId: createDto.zoomAccountId,
      zoomWebhookSecret: createDto.zoomWebhookSecret,
    };
  }

  async updateCredentials(
    teacherId: number,
    updateDto: UpdateZoomCredentialsDto,
  ): Promise<ZoomCredentials> {
    const credentials =
      await this.zoomCredentialsRepository.findByTeacherId(teacherId);
    if (!credentials) {
      throw new NotFoundException('Zoom credentials not found');
    }

    // Encrypt new values if provided
    const updates: any = {};
    if (updateDto.zoomApiKey) {
      updates.zoomApiKey = this.encrypt(updateDto.zoomApiKey);
    }
    if (updateDto.zoomApiSecret) {
      updates.zoomApiSecret = this.encrypt(updateDto.zoomApiSecret);
    }
    if (updateDto.zoomAccountId) {
      updates.zoomAccountId = this.encrypt(updateDto.zoomAccountId);
    }
    if (updateDto.zoomWebhookSecret) {
      updates.zoomWebhookSecret = this.encrypt(updateDto.zoomWebhookSecret);
    }
    if (updateDto.isActive !== undefined) {
      updates.isActive = updateDto.isActive;
    }

    const updated = await this.zoomCredentialsRepository.update(
      teacherId,
      updates,
    );
    if (!updated) {
      throw new NotFoundException('Failed to update credentials');
    }

    // Return updated credentials
    return {
      ...updated,
      zoomApiKey: updateDto.zoomApiKey || '***HIDDEN***',
      zoomApiSecret: '***HIDDEN***',
      zoomAccountId: updateDto.zoomAccountId || '***HIDDEN***',
      zoomWebhookSecret: updateDto.zoomWebhookSecret || '***HIDDEN***',
    };
  }

  async getCredentials(teacherId: number): Promise<ZoomCredentials | null> {
    const credentials =
      await this.zoomCredentialsRepository.findByTeacherId(teacherId);
    if (!credentials) return null;

    // Return decrypted data (excluding secrets)
    return {
      ...credentials,
      zoomApiKey: this.decrypt(credentials.zoomApiKey),
      zoomApiSecret: '***HIDDEN***',
      zoomAccountId: this.decrypt(credentials.zoomAccountId),
      zoomWebhookSecret: credentials.zoomWebhookSecret
        ? this.decrypt(credentials.zoomWebhookSecret)
        : undefined,
    };
  }

  async deleteCredentials(teacherId: number): Promise<void> {
    await this.zoomCredentialsRepository.deactivateByTeacherId(teacherId);
  }

  private async getZoomAccessToken(credentials: {
    zoomApiKey: string;
    zoomApiSecret: string;
    zoomAccountId: string;
  }): Promise<string> {
    const clientId = this.decrypt(credentials.zoomApiKey);
    const clientSecret = this.decrypt(credentials.zoomApiSecret);
    const accountId = this.decrypt(credentials.zoomAccountId);

    if (!clientId || !clientSecret || !accountId) {
      this.logger.error(
        'Zoom S2S OAuth credentials missing or invalid (clientId/accountId/clientSecret).',
      );
      throw new BadRequestException(
        'Zoom credentials are not configured correctly for Server-to-Server OAuth.',
      );
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!res.ok) {
      let details: any = undefined;
      try {
        details = await res.json();
      } catch {
        details = await res.text();
      }
      this.logger.error(
        `Failed to obtain Zoom access token: ${res.status} ${res.statusText} - ${JSON.stringify(details)}`,
      );
      const description =
        typeof details === 'object' &&
        details &&
        (details.error_description || details.reason || details.message);
      throw new BadRequestException(
        `Failed to obtain Zoom access token: ${description || 'Bad request'}`,
      );
    }

    const json = await res.json();
    return json.access_token as string;
  }

  // --- OAuth (Authorization Code) ---
  private async getAppOAuthConfig() {
    // First try to get from settings
    const settings = await this.settingsService.getSettings();
    
    let clientId = settings?.zoomClientId;
    let clientSecret = settings?.zoomClientSecret;
    
    // Fall back to environment variables if not in settings
    if (!clientId || !clientSecret) {
      clientId = process.env.ZOOM_OAUTH_CLIENT_ID;
      clientSecret = process.env.ZOOM_OAUTH_CLIENT_SECRET;
    }
    
    const redirectUri = process.env.ZOOM_OAUTH_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Zoom OAuth configuration not found in settings or environment variables');
    }
    
    return { clientId, clientSecret, redirectUri };
  }

  async getOAuthAuthorizeUrl(teacherId: number): Promise<string> {
    const { clientId, redirectUri } = await this.getAppOAuthConfig();
    const state = String(teacherId);
    const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
    return url;
  }

  async exchangeOAuthCode(code: string, state: string): Promise<void> {
    const { clientId, clientSecret, redirectUri } = await this.getAppOAuthConfig();
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenUrl = 'https://zoom.us/oauth/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    if (!res.ok) {
      const txt = await res.text();
      this.logger.error(
        `OAuth code exchange failed: ${res.status} ${res.statusText} - ${txt}`,
      );
      throw new BadRequestException('Zoom OAuth exchange failed');
    }
    const tokens = await res.json();
    const teacherId = parseInt(state, 10);
    await this.zoomCredentialsRepository.storeOAuthTokens(teacherId, tokens);
  }

  private async refreshOAuthToken(teacherId: number): Promise<string> {
    const { clientId, clientSecret } = await this.getAppOAuthConfig();
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const current =
      await this.zoomCredentialsRepository.getOAuthTokens(teacherId);
    if (!current?.refresh_token)
      throw new BadRequestException('Missing refresh token');
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refresh_token,
    });
    const res = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    if (!res.ok) {
      const txt = await res.text();
      this.logger.error(
        `OAuth refresh failed: ${res.status} ${res.statusText} - ${txt}`,
      );
      throw new BadRequestException('Zoom OAuth refresh failed');
    }
    const tokens = await res.json();
    await this.zoomCredentialsRepository.storeOAuthTokens(teacherId, tokens);
    return tokens.access_token as string;
  }

  private async createZoomMeetingOnZoom(
    accessToken: string,
    payload: {
      topic: string;
      start_time: string;
      duration: number;
      settings?: any;
    },
  ): Promise<{ id: number; password?: string; join_url: string }> {
    const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 2,
        topic: payload.topic,
        start_time: payload.start_time,
        duration: payload.duration,
        settings: payload.settings || {},
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(
        `Failed to create Zoom meeting: ${res.status} ${res.statusText} - ${text}`,
      );
      throw new BadRequestException('Failed to create Zoom meeting');
    }

    const data = await res.json();
    return { id: data.id, password: data.password, join_url: data.join_url };
  }

  // Zoom Meeting Management
  async createMeeting(createDto: CreateZoomMeetingDto): Promise<ZoomMeeting> {
    console.log('Creating Zoom meeting with DTO:', createDto);
    console.log(
      'Teacher ID type:',
      typeof createDto.teacherId,
      'Value:',
      createDto.teacherId,
    );

    // Get teacher's Zoom credentials
    const credentials = await this.zoomCredentialsRepository.findByTeacherId(
      createDto.teacherId,
    );
    console.log('Found credentials:', credentials);

    if (!credentials) {
      throw new BadRequestException(
        `Teacher does not have Zoom credentials. Teacher ID: ${createDto.teacherId}`,
      );
    }

    // Create meeting on Zoom using teacher OAuth token (Authorization Code)
    let accessToken: string | undefined;
    try {
      const stored = await this.zoomCredentialsRepository.getOAuthTokens(
        createDto.teacherId,
      );
      accessToken = stored?.access_token;
      if (!accessToken) throw new Error('No access token');
    } catch {
      // No token yet: respond with authorize URL info via error
      const authorizeUrl = await this.getOAuthAuthorizeUrl(createDto.teacherId);
      throw new BadRequestException(`ZOOM_OAUTH_REQUIRED:${authorizeUrl}`);
    }

    const defaultSettings = {
      waiting_room: true,
      host_video: true,
      participant_video: true,
      mute_upon_entry: true,
      auto_recording: 'none',
      join_before_host: false,
    };

    const zoomMeeting = await this.createZoomMeetingOnZoom(accessToken, {
      topic: createDto.topic,
      start_time: createDto.startTime.toISOString(),
      duration: createDto.duration,
      settings: defaultSettings,
    });

    const endTime = new Date(
      createDto.startTime.getTime() + createDto.duration * 60000,
    );

    const meeting = await this.zoomMeetingRepository.create({
      ...createDto,
      meetingId: String(zoomMeeting.id),
      meetingPassword: zoomMeeting.password || '',
      meetingUrl: zoomMeeting.join_url,
      endTime,
      status: 'scheduled',
      settings: {
        waitingRoom: true,
        recording: false,
        muteOnEntry: true,
        autoRecord: false,
        joinBeforeHost: false,
        hostVideo: true,
        participantVideo: true,
        audio: 'both',
      },
      participants: [],
    });

    return meeting;
  }

  async updateMeeting(
    meetingId: string,
    updateDto: UpdateZoomMeetingDto,
  ): Promise<ZoomMeeting> {
    const meeting = await this.zoomMeetingRepository.findByMeetingId(meetingId);
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const updates: any = { ...updateDto };

    // Recalculate end time if duration or start time changes
    if (updateDto.startTime || updateDto.duration) {
      const startTime = updateDto.startTime || meeting.startTime;
      const duration = updateDto.duration || meeting.duration;
      updates.endTime = new Date(startTime.getTime() + duration * 60000);
    }

    const updated = await this.zoomMeetingRepository.update(meetingId, updates);
    if (!updated) {
      throw new NotFoundException('Failed to update meeting');
    }

    return updated;
  }

  async getMeetingsByClass(classId: number): Promise<ZoomMeeting[]> {
    return this.zoomMeetingRepository.findByClassId(classId);
  }

  async getMeetingsByTeacher(teacherId: number): Promise<ZoomMeeting[]> {
    return this.zoomMeetingRepository.findByTeacherId(teacherId);
  }

  async getUpcomingMeetingsByClass(classId: number): Promise<ZoomMeeting[]> {
    return this.zoomMeetingRepository.findUpcomingByClassId(classId);
  }

  async getActiveMeetingsByClass(classId: number): Promise<ZoomMeeting[]> {
    return this.zoomMeetingRepository.findActiveByClassId(classId);
  }

  async getMeetingByMeetingId(meetingId: string): Promise<ZoomMeeting | null> {
    return this.zoomMeetingRepository.findByMeetingId(meetingId);
  }

  async getMeetingById(id: number): Promise<ZoomMeeting | null> {
    return this.zoomMeetingRepository.findById(id);
  }

  async startMeeting(meetingId: string): Promise<void> {
    await this.zoomMeetingRepository.updateStatus(meetingId, 'active');
  }

  async endMeeting(meetingId: string): Promise<void> {
    await this.zoomMeetingRepository.updateStatus(meetingId, 'ended');
  }

  async cancelMeeting(meetingId: string): Promise<void> {
    await this.zoomMeetingRepository.updateStatus(meetingId, 'cancelled');
  }

  async joinMeeting(
    joinDto: JoinZoomMeetingDto,
  ): Promise<{ meetingUrl: string; password: string }> {
    const meeting = await this.zoomMeetingRepository.findByMeetingId(
      joinDto.meetingId,
    );
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status !== 'active' && meeting.status !== 'scheduled') {
      throw new BadRequestException('Meeting is not available for joining');
    }

    // Add participant to meeting
    await this.zoomMeetingRepository.addParticipant(
      joinDto.meetingId,
      parseInt(joinDto.participantEmail),
    );

    return {
      meetingUrl: meeting.meetingUrl,
      password: meeting.meetingPassword,
    };
  }

  // Utility methods
  private generateMeetingId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private generateMeetingPassword(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  // Meeting SDK signature logic removed (no Web SDK embedding)

  // Generate signature for joining meeting
  // Signature generation removed

  // Test Zoom API connection
  async testZoomConnection(teacherId: number): Promise<boolean> {
    try {
      const credentials = await this.getCredentials(teacherId);
      if (!credentials) return false;

      // Here you would make a test API call to Zoom
      // For now, we'll just return true if credentials exist
      return true;
    } catch (error) {
      this.logger.error('Failed to test Zoom connection', error);
      return false;
    }
  }
}
