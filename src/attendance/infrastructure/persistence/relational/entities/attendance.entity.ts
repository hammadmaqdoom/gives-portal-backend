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
import { ClassEntity } from '../../../../../classes/infrastructure/persistence/relational/entities/class.entity';
import { AttendanceStatus } from '../../../../domain/attendance';

@Entity({
  name: 'attendance',
})
export class AttendanceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: Date })
  date: Date;

  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({ type: String, nullable: true })
  notes?: string | null;

  @ManyToOne(() => StudentEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'studentId' })
  student?: StudentEntity | null;

  @ManyToOne(() => ClassEntity, {
    eager: true,
  })
  @JoinColumn({ name: 'classId' })
  class?: ClassEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
