import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { ZoomMeeting } from '../../domain/zoom-meeting';

export abstract class ZoomMeetingRepository {
  abstract create(
    data: Omit<ZoomMeeting, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ZoomMeeting>;

  abstract findByClassId(classId: number): Promise<ZoomMeeting[]>;

  abstract findByTeacherId(teacherId: number): Promise<ZoomMeeting[]>;

  abstract findByMeetingId(
    meetingId: string,
  ): Promise<NullableType<ZoomMeeting>>;

  abstract findById(id: number): Promise<NullableType<ZoomMeeting>>;

  abstract findActiveByClassId(classId: number): Promise<ZoomMeeting[]>;

  abstract findUpcomingByClassId(classId: number): Promise<ZoomMeeting[]>;

  abstract update(
    meetingId: string,
    payload: DeepPartial<ZoomMeeting>,
  ): Promise<ZoomMeeting | null>;

  abstract updateStatus(
    meetingId: string,
    status: ZoomMeeting['status'],
  ): Promise<void>;

  abstract addParticipant(
    meetingId: string,
    participantId: number,
  ): Promise<void>;

  abstract removeParticipant(
    meetingId: string,
    participantId: number,
  ): Promise<void>;
}
