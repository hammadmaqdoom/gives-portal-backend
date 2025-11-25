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
  name: 'sms_log',
})
export class SmsLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  recipient: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 100 })
  provider: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  messageId?: string;

  @Index()
  @Column({ 
    type: 'enum', 
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  })
  status: 'pending' | 'sent' | 'delivered' | 'failed';

  @Column({ type: 'varchar', length: 10, nullable: true })
  statusCode?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
