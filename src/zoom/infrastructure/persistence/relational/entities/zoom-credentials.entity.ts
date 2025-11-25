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

@Entity('zoom_credentials')
export class ZoomCredentialsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'teacher_id' })
  teacherId: number;

  @Column({ name: 'zoom_api_key', type: 'text' })
  zoomApiKey: string;

  @Column({ name: 'zoom_api_secret', type: 'text' })
  zoomApiSecret: string;

  @Column({ name: 'zoom_account_id', type: 'text' })
  zoomAccountId: string;

  @Column({ name: 'zoom_webhook_secret', type: 'text', nullable: true })
  zoomWebhookSecret?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: UserEntity;
}
