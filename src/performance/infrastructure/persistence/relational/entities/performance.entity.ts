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
import { AssignmentEntity } from '../../../../../assignments/infrastructure/persistence/relational/entities/assignment.entity';
import { ClassEntity } from '../../../../../classes/infrastructure/persistence/relational/entities/class.entity';

@Entity({
  name: 'performance',
})
export class PerformanceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  score: number;

  @Column({ type: String, nullable: true })
  comments?: string | null;

  @Column({ type: String, nullable: true })
  grade?: string | null;

  @Column({ type: Date, nullable: true })
  submittedAt?: Date | null;

  @Column({ type: Date, nullable: true })
  gradedAt?: Date | null;

  @ManyToOne(() => StudentEntity, {
    eager: true,
  })
  student?: StudentEntity | null;

  @ManyToOne(() => AssignmentEntity, {
    eager: true,
  })
  assignment?: AssignmentEntity | null;

  @ManyToOne(() => ClassEntity, { eager: true })
  @JoinColumn({ name: 'class_id' })
  class?: ClassEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
