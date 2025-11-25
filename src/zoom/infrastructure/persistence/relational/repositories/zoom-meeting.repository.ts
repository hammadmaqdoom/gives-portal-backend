import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomMeetingEntity } from '../entities/zoom-meeting.entity';
import { ZoomMeeting } from '../../../../domain/zoom-meeting';
import { ZoomMeetingRepository } from '../../zoom-meeting.repository';
import { ZoomMeetingMapper } from '../mappers/zoom-meeting.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';

@Injectable()
export class RelationalZoomMeetingRepository implements ZoomMeetingRepository {
  constructor(
    @InjectRepository(ZoomMeetingEntity)
    private readonly repository: Repository<ZoomMeetingEntity>,
  ) {}

  async create(
    data: Omit<ZoomMeeting, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ZoomMeeting> {
    const persistenceModel = ZoomMeetingMapper.toPersistence(
      data as ZoomMeeting,
    );
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return ZoomMeetingMapper.toDomain(newEntity);
  }

  async findByClassId(classId: number): Promise<ZoomMeeting[]> {
    const entities = await this.repository.find({
      where: { classId },
      order: { startTime: 'DESC' },
    });
    return entities.map((entity) => ZoomMeetingMapper.toDomain(entity));
  }

  async findByTeacherId(teacherId: number): Promise<ZoomMeeting[]> {
    const entities = await this.repository.find({
      where: { teacherId },
      order: { startTime: 'DESC' },
    });
    return entities.map((entity) => ZoomMeetingMapper.toDomain(entity));
  }

  async findByMeetingId(meetingId: string): Promise<NullableType<ZoomMeeting>> {
    const entity = await this.repository.findOne({ where: { meetingId } });
    return entity ? ZoomMeetingMapper.toDomain(entity) : null;
  }

  async findById(id: number): Promise<NullableType<ZoomMeeting>> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ZoomMeetingMapper.toDomain(entity) : null;
  }

  async findActiveByClassId(classId: number): Promise<ZoomMeeting[]> {
    const entities = await this.repository.find({
      where: {
        classId,
        status: 'active',
      },
      order: { startTime: 'DESC' },
    });
    return entities.map((entity) => ZoomMeetingMapper.toDomain(entity));
  }

  async findUpcomingByClassId(classId: number): Promise<ZoomMeeting[]> {
    const now = new Date();
    const entities = await this.repository
      .createQueryBuilder('meeting')
      .where('meeting.classId = :classId', { classId })
      .andWhere('meeting.status = :status', { status: 'scheduled' })
      .andWhere('meeting.startTime > :now', { now })
      .orderBy('meeting.startTime', 'ASC')
      .getMany();
    return entities.map((entity) => ZoomMeetingMapper.toDomain(entity));
  }

  async update(
    meetingId: string,
    payload: DeepPartial<ZoomMeeting>,
  ): Promise<ZoomMeeting | null> {
    const entity = await this.repository.findOne({
      where: { meetingId },
    });

    if (!entity) {
      return null;
    }

    await this.repository.update({ meetingId }, payload as any);
    const updatedEntity = await this.repository.findOne({
      where: { meetingId },
    });

    return updatedEntity ? ZoomMeetingMapper.toDomain(updatedEntity) : null;
  }

  async updateStatus(
    meetingId: string,
    status: ZoomMeeting['status'],
  ): Promise<void> {
    await this.repository.update({ meetingId }, { status });
  }

  async addParticipant(
    meetingId: string,
    participantId: number,
  ): Promise<void> {
    const meeting = await this.findByMeetingId(meetingId);
    if (meeting && !meeting.participants.includes(participantId)) {
      meeting.participants.push(participantId);
      const entity = await this.repository.findOne({ where: { meetingId } });
      if (entity) {
        entity.participants = meeting.participants;
        await this.repository.save(entity);
      }
    }
  }

  async removeParticipant(
    meetingId: string,
    participantId: number,
  ): Promise<void> {
    const meeting = await this.findByMeetingId(meetingId);
    if (meeting) {
      meeting.participants = meeting.participants.filter(
        (id) => id !== participantId,
      );
      const entity = await this.repository.findOne({ where: { meetingId } });
      if (entity) {
        entity.participants = meeting.participants;
        await this.repository.save(entity);
      }
    }
  }
}
