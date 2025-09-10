import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ClassEntity } from '../../../../../classes/infrastructure/persistence/relational/entities/class.entity';

@Entity({ name: 'announcement' })
export class AnnouncementEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: String })
  title: string;

  @Column({ type: String, nullable: true })
  bodyHtml?: string | null;

  @Column({ type: 'boolean', default: false })
  pinned: boolean;

  @Column({ type: Date, nullable: true })
  publishAt?: Date | null;

  @ManyToOne(() => ClassEntity, { eager: true })
  class?: ClassEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
