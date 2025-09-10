import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'files' })
export class FileEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  path: string;

  @Column({ nullable: true })
  url: string;

  @Column('bigint')
  size: number;

  @Column()
  mimeType: string;

  @Column()
  uploadedBy: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column()
  contextType: string; // 'assignment', 'submission', 'module'

  @Column()
  contextId: string; // ID of the assignment, submission, or module

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
