import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsDate,
  IsObject,
} from 'class-validator';

export class ZoomMeeting {
  id: number;
  classId: number;
  teacherId: number;
  meetingId: string;
  meetingPassword: string;
  meetingUrl: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  settings: {
    waitingRoom: boolean;
    recording: boolean;
    muteOnEntry: boolean;
    autoRecord: boolean;
    joinBeforeHost: boolean;
    hostVideo: boolean;
    participantVideo: boolean;
    audio: 'both' | 'telephony' | 'computer_audio';
  };
  participants: number[];
  createdAt: Date;
  updatedAt: Date;
}

export class CreateZoomMeetingDto {
  @IsNumber()
  classId: number;

  @IsNumber()
  teacherId: number;

  @IsString()
  topic: string;

  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startTime: Date;

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsObject()
  settings?: Partial<ZoomMeeting['settings']>;
}

export class UpdateZoomMeetingDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  startTime?: Date;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  status?: ZoomMeeting['status'];

  @IsOptional()
  @IsObject()
  settings?: Partial<ZoomMeeting['settings']>;
}

export class JoinZoomMeetingDto {
  @IsString()
  meetingId: string;

  @IsString()
  password: string;

  @IsString()
  participantName: string;

  @IsString()
  participantEmail: string;
}
