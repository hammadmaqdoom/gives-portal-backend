import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'fee_reminder_log',
})
export class FeeReminderLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  studentId: number;

  @Column({ type: 'int', nullable: true })
  parentId?: number;

  @Column({ type: 'int', nullable: true })
  invoiceId?: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ['email', 'sms', 'whatsapp'],
  })
  reminderType: 'email' | 'sms' | 'whatsapp';

  @Index()
  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'sent' | 'failed';

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 255 })
  recipient: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
