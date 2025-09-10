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
  OneToOne,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { StudentClassEnrollmentEntity } from './student-class-enrollment.entity';
import { ParentStudentEntity } from '../../../../../parents/infrastructure/persistence/relational/entities/parent-student.entity';

@Entity({
  name: 'student',
})
export class StudentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: String, unique: true })
  studentId: string;

  @Index()
  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  address?: string | null;

  @Column({ type: String, nullable: true })
  city?: string | null;

  @Column({ type: String, nullable: true })
  state?: string | null;

  @Column({ type: String, nullable: true })
  country?: string | null;

  @Column({ type: Date, nullable: true })
  dateOfBirth?: Date | null;

  @Column({ type: String, nullable: true })
  email?: string | null;

  @Column({ type: String, nullable: true })
  contact?: string | null;

  @OneToOne(() => FileEntity, {
    // eager: true, // Removed to fix query builder issues
  })
  @JoinColumn()
  photo?: FileEntity | null;

  @OneToOne(() => UserEntity, {
    // eager: true, // Removed to fix query builder issues
  })
  @JoinColumn()
  user?: UserEntity | null;

  @OneToMany(
    () => StudentClassEnrollmentEntity,
    (enrollment) => enrollment.student,
    {
      // eager: true, // Removed to fix query builder issues
    },
  )
  classEnrollments?: StudentClassEnrollmentEntity[];

  @OneToMany(
    () => ParentStudentEntity,
    (parentStudent) => parentStudent.student,
    {
      // eager: true, // Removed to fix query builder issues
    },
  )
  parentStudents?: ParentStudentEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
