import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { LearningModuleEntity } from './learning-module.entity';

@Entity('module_completion')
export class ModuleCompletionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id' })
  studentId: number;

  @Column({ name: 'module_id' })
  moduleId: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => StudentEntity)
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  @ManyToOne(() => LearningModuleEntity)
  @JoinColumn({ name: 'module_id' })
  module: LearningModuleEntity;
}
