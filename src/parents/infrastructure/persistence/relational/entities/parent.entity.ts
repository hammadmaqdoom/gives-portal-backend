import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { ParentStudentEntity } from './parent-student.entity';

@Entity({
  name: 'parent',
})
export class ParentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: String })
  fullName: string;

  @Column({ type: String, nullable: true })
  mobile?: string | null;

  @Column({ type: String, nullable: true })
  landline?: string | null;

  @Column({ type: String, nullable: true })
  address?: string | null;

  @Column({ type: String, nullable: true })
  city?: string | null;

  @Column({ type: String, nullable: true })
  state?: string | null;

  @Column({ type: String, nullable: true })
  country?: string | null;

  @Column({ type: String, nullable: true })
  email?: string | null;

  @Column({ type: String, nullable: true })
  relationship?: 'father' | 'mother' | 'guardian' | null;

  @Column({ type: String, nullable: true })
  maritalStatus?: 'married' | 'divorced' | 'deceased' | 'single' | null;

  @Column({ type: String, nullable: true })
  passcode?: string | null;

  @OneToOne(() => UserEntity, {
    // eager: true, // Removed to fix query builder issues
  })
  @JoinColumn()
  user?: UserEntity | null;

  @OneToMany(
    () => ParentStudentEntity,
    (parentStudent) => parentStudent.parent,
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
