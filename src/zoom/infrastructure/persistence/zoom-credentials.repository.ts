import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { ZoomCredentials } from '../../domain/zoom-credentials';

export abstract class ZoomCredentialsRepository {
  abstract create(
    data: Omit<ZoomCredentials, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ZoomCredentials>;

  abstract findByTeacherId(
    teacherId: number,
  ): Promise<NullableType<ZoomCredentials>>;

  abstract update(
    teacherId: number,
    payload: DeepPartial<ZoomCredentials>,
  ): Promise<ZoomCredentials | null>;

  abstract deactivateByTeacherId(teacherId: number): Promise<void>;

  // OAuth token storage helpers
  abstract storeOAuthTokens(teacherId: number, tokens: any): Promise<void>;
  abstract getOAuthTokens(teacherId: number): Promise<any | null>;

  // Statistics
  abstract getTeacherStatistics(): Promise<{
    totalTeachers: number;
    connectedTeachers: number;
    notConnectedTeachers: number;
  }>;
}
