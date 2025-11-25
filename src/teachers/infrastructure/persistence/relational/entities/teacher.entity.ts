import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'teacher',
})
export class TeacherEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: String })
  name: string;

  @Index()
  @Column({ type: String, nullable: true })
  email?: string | null;

  @Column({ type: String, nullable: true })
  phone?: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionPercentage: number;

  @Column({ type: 'jsonb' })
  subjectsAllowed: number[];

  @Column({ type: String, nullable: true })
  payoutMethod?: string | null;

  @Column({ type: String, nullable: true })
  bankName?: string | null;

  @Column({ type: String, nullable: true })
  accountNumber?: string | null;

  @Column({ type: String, nullable: true })
  bankCode?: string | null;

  @Column({ type: String, nullable: true })
  iban?: string | null;

  @Column({ type: String, nullable: true })
  accountHolderName?: string | null;

  @Column({ type: String, nullable: true })
  bankBranch?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
