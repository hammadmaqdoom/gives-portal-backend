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
import { TeacherEntity } from './teacher.entity';
import { ClassEntity } from '../../../../../classes/infrastructure/persistence/relational/entities/class.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';

@Entity({
  name: 'teacher_commission',
})
export class TeacherCommissionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  commissionPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionAmount: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ['pending', 'calculated', 'paid', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ type: Date })
  dueDate: Date;

  @Column({ type: Date, nullable: true })
  paidAt?: Date | null;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ type: String, nullable: true })
  transactionId?: string | null;

  @ManyToOne(() => TeacherEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'teacherId' })
  teacher?: TeacherEntity | null;

  @ManyToOne(() => ClassEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'classId' })
  class?: ClassEntity | null;

  @ManyToOne(() => StudentEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'studentId' })
  student?: StudentEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
