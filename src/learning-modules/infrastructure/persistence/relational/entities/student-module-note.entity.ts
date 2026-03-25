import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { LearningModuleEntity } from './learning-module.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';

@Entity({ name: 'student_module_note' })
@Unique(['studentId', 'moduleId'])
export class StudentModuleNoteEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', name: 'module_id' })
  moduleId: number;

  @Index()
  @Column({ type: 'int', name: 'student_id' })
  studentId: number;

  @Column({ type: 'text', nullable: true, name: 'note_content' })
  noteContent?: string | null;

  @ManyToOne(() => LearningModuleEntity, { eager: false })
  @JoinColumn({ name: 'module_id' })
  module?: LearningModuleEntity | null;

  @ManyToOne(() => StudentEntity, { eager: false })
  @JoinColumn({ name: 'student_id' })
  student?: StudentEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
