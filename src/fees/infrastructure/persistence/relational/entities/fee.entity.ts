import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { ClassEntity } from '../../../../../classes/infrastructure/persistence/relational/entities/class.entity';
import { PaymentStatus, PaymentMethod } from '../../../../domain/fee';

@Entity({
  name: 'fee',
})
export class FeeEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod | null;

  @Column({ type: String, nullable: true })
  transactionId?: string | null;

  @Index()
  @Column({ type: Date })
  dueDate: Date;

  @Column({ type: Date, nullable: true })
  paidAt?: Date | null;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @ManyToOne(() => StudentEntity, {
    eager: true,
  })
  student?: StudentEntity | null;

  @ManyToOne(() => ClassEntity, {
    eager: true,
  })
  class?: ClassEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
