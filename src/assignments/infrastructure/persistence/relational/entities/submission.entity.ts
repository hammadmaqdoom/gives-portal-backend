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
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { AssignmentEntity } from './assignment.entity';

export enum SubmissionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  LATE = 'late',
}

@Entity({
  name: 'submission',
})
export class SubmissionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({ type: 'int', nullable: true })
  score?: number | null;

  @Column({ type: String, nullable: true })
  grade?: string | null;

  @Column({ type: String, nullable: true })
  comments?: string | null;

  @Column({ type: String, nullable: true })
  fileUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  attachments?: string | null;

  @Column({ type: Date, nullable: true })
  submittedAt?: Date | null;

  @Column({ type: Date, nullable: true })
  gradedAt?: Date | null;

  @ManyToOne(() => StudentEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'studentId' })
  student?: StudentEntity | null;

  @ManyToOne(() => AssignmentEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'assignmentId' })
  assignment?: AssignmentEntity | null;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
