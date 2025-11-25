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
import { ParentEntity } from './parent.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';

@Entity({
  name: 'parent_student',
})
@Unique(['parentId', 'studentId'])
export class ParentStudentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  parentId: number;

  @Index()
  @Column({ type: 'int' })
  studentId: number;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'inactive';

  @ManyToOne(() => ParentEntity, {})
  @JoinColumn({ name: 'parentId' })
  parent: ParentEntity;

  @ManyToOne(() => StudentEntity, {})
  @JoinColumn({ name: 'studentId' })
  student: StudentEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
