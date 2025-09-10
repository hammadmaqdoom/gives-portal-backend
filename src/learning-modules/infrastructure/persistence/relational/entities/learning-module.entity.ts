import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ClassEntity } from '../../../../../classes/infrastructure/persistence/relational/entities/class.entity';

@Entity({ name: 'learning_module' })
export class LearningModuleEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: String })
  title: string;

  @Column({ type: String, nullable: true })
  contentHtml?: string | null;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @Column({ type: 'int', nullable: true })
  classId?: number | null;

  @Column({ type: 'bigint', nullable: true })
  groupId?: string | null;

  @Column({ type: String, nullable: true })
  videoUrl?: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_pinned' })
  isPinned: boolean;

  @Column({ type: 'int', nullable: true, name: 'zoom_meeting_id' })
  zoomMeetingId?: number | null;

  @Column({ type: String, nullable: true, name: 'zoom_meeting_url' })
  zoomMeetingUrl?: string | null;

  @Column({ type: String, nullable: true, name: 'zoom_meeting_password' })
  zoomMeetingPassword?: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'zoom_meeting_start_time',
  })
  zoomMeetingStartTime?: Date | null;

  @Column({ type: 'int', nullable: true, name: 'zoom_meeting_duration' })
  zoomMeetingDuration?: number | null;

  @ManyToOne(() => ClassEntity, { eager: true })
  @JoinColumn({ name: 'classId' })
  class?: ClassEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
