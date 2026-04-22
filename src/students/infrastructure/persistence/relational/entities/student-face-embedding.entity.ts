import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { StudentEntity } from './student.entity';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';

@Entity({
  name: 'student_face_embedding',
})
export class StudentFaceEmbeddingEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  studentId: number;

  // Postgres real[] → number[]. 128 floats for face-api.js v1 SSD model.
  @Column({ type: 'real', array: true })
  embedding: number[];

  @Column({ type: 'varchar', length: 128 })
  modelName: string;

  @Column({ type: 'real', nullable: true })
  qualityScore?: number | null;

  @Column({ type: 'int', nullable: true })
  sourceFileId?: number | null;

  @ManyToOne(() => StudentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student?: StudentEntity;

  @ManyToOne(() => FileEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sourceFileId' })
  sourceFile?: FileEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
