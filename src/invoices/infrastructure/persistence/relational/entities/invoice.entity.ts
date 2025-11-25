import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { ParentEntity } from '../../../../../parents/infrastructure/persistence/relational/entities/parent.entity';
import { InvoiceItemEntity } from './invoice-item.entity';
import { InvoiceStatus, PaymentMethod } from '../../../../domain/invoice';

@Entity({
  name: 'invoice',
})
export class InvoiceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: String, unique: true })
  invoiceNumber: string;

  @ManyToOne(() => StudentEntity, { eager: true })
  @JoinColumn()
  student: StudentEntity;

  @ManyToOne(() => ParentEntity, { eager: true, nullable: true })
  @JoinColumn()
  parent?: ParentEntity;

  @OneToMany(() => InvoiceItemEntity, (item) => item.invoice, { cascade: true })
  items?: InvoiceItemEntity[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: String, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  generatedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidDate?: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod?: PaymentMethod;

  @Column({ type: String, nullable: true })
  transactionId?: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: String, nullable: true })
  paymentProofUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
