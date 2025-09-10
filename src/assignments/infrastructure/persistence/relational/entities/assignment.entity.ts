import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ClassEntity } from '../../../../../classes/infrastructure/persistence/relational/entities/class.entity';
import { TeacherEntity } from '../../../../../teachers/infrastructure/persistence/relational/entities/teacher.entity';
import { SubmissionEntity } from './submission.entity';
import {
  AssignmentType,
  AssignmentStatus,
} from '../../../../domain/assignment';

@Entity({
  name: 'assignment',
})
export class AssignmentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: String })
  title: string;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Index()
  @Column({ type: Date })
  dueDate: Date;

  @Column({ type: 'enum', enum: AssignmentType })
  type: AssignmentType;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.DRAFT,
  })
  status: AssignmentStatus;

  @Column({ type: 'int', nullable: true })
  maxScore?: number | null;

  @Column({ type: 'text', nullable: true })
  markingCriteria?: string | null;

  @Column({ type: 'simple-array', nullable: true })
  attachments?: string[] | null;

  @ManyToOne(() => ClassEntity, {
    eager: true,
  })
  class?: ClassEntity | null;

  @ManyToOne(() => TeacherEntity, {
    eager: true,
  })
  teacher?: TeacherEntity | null;

  @OneToMany(() => SubmissionEntity, (submission) => submission.assignment)
  submissions?: SubmissionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
