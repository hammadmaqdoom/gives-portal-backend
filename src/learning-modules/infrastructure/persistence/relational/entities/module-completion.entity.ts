import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { LearningModuleEntity } from './learning-module.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';

@Entity({ name: 'module_completion' })
export class ModuleCompletionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', name: 'module_id' })
  moduleId: number;

  @Index()
  @Column({ type: 'int', name: 'student_id' })
  studentId: number;

  @Column({ type: 'boolean', default: false, name: 'is_completed' })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt?: Date | null;

  @Column({ type: 'int', default: 0, name: 'progress_percentage' })
  progressPercentage: number; // 0-100

  @Column({ type: 'int', default: 0, name: 'time_spent' })
  timeSpent: number; // Time spent in seconds

  @Column({ type: 'jsonb', nullable: true, name: 'completion_data' })
  completionData?: any; // Additional completion tracking data

  @ManyToOne(() => LearningModuleEntity, { eager: true })
  @JoinColumn({ name: 'module_id' })
  module?: LearningModuleEntity | null;

  @ManyToOne(() => StudentEntity, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student?: StudentEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
