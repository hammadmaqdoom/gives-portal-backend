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
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { StudentEntity } from './student.entity';
import { ClassEntity } from '../../../../../classes/infrastructure/persistence/relational/entities/class.entity';

@Entity({
  name: 'student_class_enrollment',
})
@Unique(['studentId', 'classId'])
export class StudentClassEnrollmentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  studentId: number;

  @Index()
  @Column({ type: 'int' })
  classId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  enrollmentDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  deenrollmentDate?: Date;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'inactive' | 'completed' | 'dropped';

  @Column({ type: 'boolean', default: false })
  adminGrantedAccess: boolean;

  @ManyToOne(() => StudentEntity, {})
  @JoinColumn({ name: 'studentId' })
  student: StudentEntity;

  @ManyToOne(() => ClassEntity, {})
  @JoinColumn({ name: 'classId' })
  class: ClassEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
