import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ClassEntity } from './class.entity';

export enum Weekday {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Entity({
  name: 'class_schedule',
})
export class ClassScheduleEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  classId: number;

  @Column({
    type: 'enum',
    enum: Weekday,
  })
  weekday: Weekday;

  @Column({ type: 'time' })
  startTime: string; // Format: "HH:MM" (24-hour)

  @Column({ type: 'time' })
  endTime: string; // Format: "HH:MM" (24-hour)

  @Column({ type: String, default: 'Asia/Karachi' })
  timezone: string; // IANA timezone identifier (e.g., "America/New_York")

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  effectiveFrom?: Date; // When this schedule becomes effective

  @Column({ type: 'date', nullable: true })
  effectiveUntil?: Date; // When this schedule expires

  @Column({ type: 'text', nullable: true })
  notes?: string; // Additional notes for this schedule

  @ManyToOne(() => ClassEntity, (klass) => klass.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'classId' })
  class: ClassEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
