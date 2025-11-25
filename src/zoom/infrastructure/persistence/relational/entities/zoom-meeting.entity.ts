import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { ClassEntity } from '../../../../../classes/infrastructure/persistence/relational/entities/class.entity';

@Entity('zoom_meetings')
export class ZoomMeetingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'class_id' })
  classId: number;

  @Column({ name: 'teacher_id' })
  teacherId: number;

  @Column({ name: 'meeting_id', unique: true })
  meetingId: string;

  @Column({ name: 'meeting_password' })
  meetingPassword: string;

  @Column({ name: 'meeting_url', type: 'text' })
  meetingUrl: string;

  @Column({ type: 'text' })
  topic: string;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'int' })
  duration: number;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'active', 'ended', 'cancelled'],
    default: 'scheduled',
  })
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';

  @Column({ type: 'jsonb' })
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

  @Column({ type: 'int', array: true, default: [] })
  participants: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: UserEntity;
}
