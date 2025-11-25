import { ZoomMeeting } from '../../../../domain/zoom-meeting';
import { ZoomMeetingEntity } from '../entities/zoom-meeting.entity';

export class ZoomMeetingMapper {
  static toDomain(raw: ZoomMeetingEntity): ZoomMeeting {
    const zoomMeeting = new ZoomMeeting();
    zoomMeeting.id = raw.id;
    zoomMeeting.classId = raw.classId;
    zoomMeeting.teacherId = raw.teacherId;
    zoomMeeting.meetingId = raw.meetingId;
    zoomMeeting.meetingPassword = raw.meetingPassword;
    zoomMeeting.meetingUrl = raw.meetingUrl;
    zoomMeeting.topic = raw.topic;
    zoomMeeting.startTime = raw.startTime;
    zoomMeeting.endTime = raw.endTime;
    zoomMeeting.duration = raw.duration;
    zoomMeeting.status = raw.status;
    zoomMeeting.settings = raw.settings;
    zoomMeeting.participants = raw.participants;
    zoomMeeting.createdAt = raw.createdAt;
    zoomMeeting.updatedAt = raw.updatedAt;
    return zoomMeeting;
  }

  static toPersistence(domain: ZoomMeeting): Partial<ZoomMeetingEntity> {
    return {
      id: domain.id,
      classId: domain.classId,
      teacherId: domain.teacherId,
      meetingId: domain.meetingId,
      meetingPassword: domain.meetingPassword,
      meetingUrl: domain.meetingUrl,
      topic: domain.topic,
      startTime: domain.startTime,
      endTime: domain.endTime,
      duration: domain.duration,
      status: domain.status,
      settings: domain.settings,
      participants: domain.participants,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
