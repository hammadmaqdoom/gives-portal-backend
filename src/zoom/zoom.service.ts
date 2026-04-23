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

    // Check if this is an OAuth-only connection (has OAuth tokens)
    const oauthTokens = await this.zoomCredentialsRepository.getOAuthTokens(teacherId);
    const isPlaceholder = credentials.zoomApiKey === 'oauth-only';

    // Return decrypted data (excluding secrets)
    // For OAuth-only connections, skip decryption of placeholder values
    try {
      // Handle zoomWebhookSecret - it might contain OAuth tokens (JSON) or encrypted webhook secret
      let webhookSecret: string | undefined = undefined;
      if (credentials.zoomWebhookSecret) {
        // If it's OAuth tokens (starts with '{' or '['), return as-is
        // Otherwise, try to decrypt it (it's a webhook secret)
        if (credentials.zoomWebhookSecret.trim().startsWith('{') || credentials.zoomWebhookSecret.trim().startsWith('[')) {
          // It's OAuth tokens JSON, return as-is (but don't expose it)
          webhookSecret = '***OAUTH_TOKENS_STORED***';
        } else {
          // It's an encrypted webhook secret, try to decrypt
          try {
            webhookSecret = this.decrypt(credentials.zoomWebhookSecret);
          } catch {
            // If decryption fails, it might be OAuth tokens stored without JSON wrapper
            webhookSecret = '***HIDDEN***';
          }
        }
      }
      
      return {
        ...credentials,
        zoomApiKey: isPlaceholder ? 'oauth-only' : this.decrypt(credentials.zoomApiKey),
        zoomApiSecret: '***HIDDEN***',
        zoomAccountId: isPlaceholder ? 'oauth-only' : this.decrypt(credentials.zoomAccountId),
        zoomWebhookSecret: webhookSecret,
      };
    } catch (error) {
      // If decryption fails, check if OAuth tokens exist (OAuth-only connection)
      if (oauthTokens || isPlaceholder) {
        return {
          ...credentials,
          zoomApiKey: 'oauth-only',
          zoomApiSecret: '***HIDDEN***',
          zoomAccountId: 'oauth-only',
          zoomWebhookSecret: credentials.zoomWebhookSecret ? '***OAUTH_TOKENS_STORED***' : undefined,
        };
      }
      // If no OAuth tokens and decryption fails, return null
      this.logger.error('Failed to decrypt Zoom credentials', error);
      return null;
    }
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
    
    // Get values from settings, trimming whitespace and checking for empty strings
    let clientId = settings?.zoomClientId?.trim() || null;
    let clientSecret = settings?.zoomClientSecret?.trim() || null;
    let redirectUri = settings?.zoomRedirectUri?.trim() || null;
    
    // Fall back to environment variables if not in settings (check each field individually)
    if (!clientId || clientId === '') {
      clientId = process.env.ZOOM_OAUTH_CLIENT_ID?.trim() || null;
    }
    
    if (!clientSecret || clientSecret === '') {
      clientSecret = process.env.ZOOM_OAUTH_CLIENT_SECRET?.trim() || null;
    }
    
    if (!redirectUri || redirectUri === '') {
      redirectUri = process.env.ZOOM_OAUTH_REDIRECT_URI?.trim() || null;
    }
    
    // Validate all required fields are present
    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.error('Zoom OAuth configuration missing:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUri: !!redirectUri,
        settingsExists: !!settings,
      });
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
      throw new BadRequestException(`Zoom OAuth exchange failed: ${txt}`);
    }
    const tokens = await res.json();
    const teacherId = parseInt(state, 10);
    
    if (isNaN(teacherId)) {
      this.logger.error(`Invalid teacher ID in OAuth state: ${state}`);
      throw new BadRequestException('Invalid OAuth state parameter');
    }
    
    try {
      // Store tokens with timestamp for expiration tracking
      const tokensWithTimestamp = {
        ...tokens,
        _issued_at: Date.now(), // Store when token was issued
      };
      await this.zoomCredentialsRepository.storeOAuthTokens(teacherId, tokensWithTimestamp);
      this.logger.log(`Successfully stored OAuth tokens for teacher ${teacherId}`);
    } catch (error) {
      this.logger.error(`Failed to store OAuth tokens for teacher ${teacherId}:`, error);
      throw new BadRequestException('Failed to store Zoom OAuth tokens');
    }
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
    // Store tokens with timestamp for expiration tracking
    const tokensWithTimestamp = {
      ...tokens,
      _issued_at: Date.now(), // Store when token was issued
    };
    await this.zoomCredentialsRepository.storeOAuthTokens(teacherId, tokensWithTimestamp);
    return tokens.access_token as string;
  }

  /**
   * Gets a valid access token for the teacher, automatically refreshing if expired or about to expire
   * @param teacherId The teacher ID
   * @returns A valid access token
   */
  private async getValidAccessToken(teacherId: number): Promise<string> {
    const stored = await this.zoomCredentialsRepository.getOAuthTokens(teacherId);
    
    if (!stored?.access_token) {
      throw new BadRequestException('No access token found');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresIn = stored.expires_in || 3600; // Default to 1 hour if not provided
    const issuedAt = stored._issued_at || Date.now(); // Use stored timestamp or assume just issued
    const expirationTime = issuedAt + (expiresIn * 1000); // Convert to milliseconds
    const now = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;

    // If token is expired or will expire within 5 minutes, refresh it
    if (now >= expirationTime - fiveMinutesInMs) {
      this.logger.log(`Access token expired or expiring soon for teacher ${teacherId}, refreshing...`);
      try {
        return await this.refreshOAuthToken(teacherId);
      } catch (error) {
        this.logger.error(`Failed to refresh token for teacher ${teacherId}:`, error);
        throw new BadRequestException('Access token expired and refresh failed. Please reconnect your Zoom account.');
      }
    }

    return stored.access_token;
  }

  private async createZoomMeetingOnZoom(
    accessToken: string,
    payload: {
      topic: string;
      start_time: string;
      duration: number;
      settings?: any;
    },
    teacherId?: number,
    retryWithRefresh: boolean = true,
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

    // Handle 401 Unauthorized - token expired, try refreshing and retrying
    if (res.status === 401 && retryWithRefresh && teacherId) {
      this.logger.warn(`Access token expired during API call for teacher ${teacherId}, refreshing and retrying...`);
      try {
        const refreshedToken = await this.refreshOAuthToken(teacherId);
        // Retry once with refreshed token
        return this.createZoomMeetingOnZoom(refreshedToken, payload, teacherId, false);
      } catch (refreshError) {
        this.logger.error(`Failed to refresh token during API retry:`, refreshError);
        throw new BadRequestException('Access token expired and refresh failed. Please reconnect your Zoom account.');
      }
    }

    if (!res.ok) {
      let errorDetails: any;
      try {
        errorDetails = await res.json();
      } catch {
        errorDetails = await res.text();
      }
      
      this.logger.error(
        `Failed to create Zoom meeting: ${res.status} ${res.statusText} - ${JSON.stringify(errorDetails)}`,
      );
      
      const errorMessage = 
        typeof errorDetails === 'object' && errorDetails?.message
          ? errorDetails.message
          : typeof errorDetails === 'string'
          ? errorDetails
          : 'Failed to create Zoom meeting';
      
      throw new BadRequestException(`Failed to create Zoom meeting: ${errorMessage}`);
    }

    const data = await res.json();
    return { id: data.id, password: data.password, join_url: data.join_url };
  }

  // Zoom Meeting Management
  async createMeeting(createDto: CreateZoomMeetingDto): Promise<ZoomMeeting> {
    this.logger.log(
      `createMeeting teacherId=${createDto.teacherId} topic=${createDto.topic ?? '-'}`,
    );

    const credentials = await this.zoomCredentialsRepository.findByTeacherId(
      createDto.teacherId,
    );
    this.logger.debug(
      `Zoom credentials lookup teacherId=${createDto.teacherId} -> ${credentials ? 'found' : 'not found'}`,
    );

    if (!credentials) {
      throw new BadRequestException(
        `Teacher does not have Zoom credentials. Teacher ID: ${createDto.teacherId}`,
      );
    }

    // Create meeting on Zoom using teacher OAuth token (Authorization Code)
    // Get valid access token (auto-refreshes if expired)
    let accessToken: string;
    try {
      accessToken = await this.getValidAccessToken(createDto.teacherId);
    } catch (error: any) {
      // No token or refresh failed: respond with authorize URL info via error
      if (error.message?.includes('No access token') || error.message?.includes('refresh failed')) {
        this.logger.warn(`No valid OAuth token for teacher ${createDto.teacherId}, redirecting to OAuth`);
        try {
          const authorizeUrl = await this.getOAuthAuthorizeUrl(createDto.teacherId);
          throw new BadRequestException(`ZOOM_OAUTH_REQUIRED:${authorizeUrl}`);
        } catch (oauthError: any) {
          // If getting OAuth URL fails, return a more helpful error
          if (oauthError.message?.includes('ZOOM_OAUTH_REQUIRED')) {
            throw oauthError;
          }
          this.logger.error('Failed to get OAuth authorize URL:', oauthError);
          throw new BadRequestException(
            'Zoom OAuth is not configured. Please contact your administrator.',
          );
        }
      }
      throw error;
    }

    const defaultSettings = {
      waiting_room: true,
      host_video: true,
      participant_video: true,
      mute_upon_entry: true,
      auto_recording: 'none',
      join_before_host: false,
    };

    const zoomMeeting = await this.createZoomMeetingOnZoom(
      accessToken,
      {
        topic: createDto.topic,
        start_time: createDto.startTime.toISOString(),
        duration: createDto.duration,
        settings: defaultSettings,
      },
      createDto.teacherId, // Pass teacherId for automatic retry on 401
    );

    const endTime = new Date(
      createDto.startTime.getTime() + createDto.duration * 60000,
    );

    const meeting = await this.zoomMeetingRepository.create({
      ...createDto,
      classId: createDto.classId ?? 0, // Use 0 as default if classId is not provided
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

      // Check if OAuth tokens exist (for OAuth Authorization Code flow)
      const oauthTokens = await this.zoomCredentialsRepository.getOAuthTokens(teacherId);
      if (oauthTokens) {
        // OAuth connection exists - verify token is still valid by attempting to refresh if needed
        // For now, just check if tokens exist
        return true;
      }

      // If no OAuth tokens, check if S2S credentials exist (not placeholder)
      if (credentials.zoomApiKey && credentials.zoomApiKey !== 'oauth-only') {
        // S2S credentials exist
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to test Zoom connection', error);
      return false;
    }
  }

  // Get teacher Zoom statistics for admin
  async getTeacherZoomStatistics(): Promise<{
    totalTeachers: number;
    connectedTeachers: number;
    notConnectedTeachers: number;
    teachers: {
      teacherId: number;
      name: string;
      email?: string | null;
      isConnected: boolean;
      lastUpdatedAt: Date | null;
    }[];
  }> {
    const stats = await this.zoomCredentialsRepository.getTeacherStatistics();
    return stats;
  }
}
