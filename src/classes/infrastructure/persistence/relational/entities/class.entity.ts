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
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { SubjectEntity } from '../../../../../subjects/infrastructure/persistence/relational/entities/subject.entity';
import { TeacherEntity } from '../../../../../teachers/infrastructure/persistence/relational/entities/teacher.entity';
import { StudentClassEnrollmentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student-class-enrollment.entity';
import { ClassScheduleEntity } from './class-schedule.entity';

@Entity({
  name: 'class',
})
export class ClassEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: String })
  name: string;

  @Column({ type: String })
  batchTerm: string;

  @Column({ type: 'jsonb', nullable: true })
  weekdays?: string[]; // Legacy field - will be deprecated

  @Column({ type: String, nullable: true })
  timing?: string; // Legacy field - will be deprecated

  @Column({ type: String, default: 'Asia/Karachi' })
  timezone: string; // Default timezone for the class

  @Column({ type: String, nullable: true })
  courseOutline?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  feeUSD: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  feePKR: number;

  @Column({ type: 'enum', enum: ['virtual', 'in-person'], default: 'virtual' })
  classMode: 'virtual' | 'in-person';

  @ManyToOne(() => SubjectEntity, {
    eager: true,
  })
  subject?: SubjectEntity | null;

  @ManyToOne(() => TeacherEntity, {
    eager: true,
  })
  teacher?: TeacherEntity | null;

  @OneToMany(
    () => StudentClassEnrollmentEntity,
    (enrollment) => enrollment.class,
    {
      eager: true,
    },
  )
  studentEnrollments?: StudentClassEnrollmentEntity[];

  @OneToMany(() => ClassScheduleEntity, (schedule) => schedule.class, {
    eager: true,
  })
  schedules?: ClassScheduleEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
