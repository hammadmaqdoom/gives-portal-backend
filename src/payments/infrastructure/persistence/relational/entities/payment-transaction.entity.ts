import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { PaymentGatewayEntity } from './payment-gateway.entity';
import { InvoiceEntity } from '../../../../../invoices/infrastructure/persistence/relational/entities/invoice.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { ParentEntity } from '../../../../../parents/infrastructure/persistence/relational/entities/parent.entity';

@Entity({
  name: 'payment_transaction',
})
export class PaymentTransactionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  transactionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  gatewayTransactionId?: string;

  @Column({ type: 'integer' })
  @Index()
  gatewayId: number;

  @Column({ type: 'integer', nullable: true })
  @Index()
  invoiceId?: number;

  @Column({ type: 'integer' })
  @Index()
  studentId: number;

  @Column({ type: 'integer', nullable: true })
  parentId?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'PKR' })
  currency: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  @Index()
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'refunded';

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse?: any;

  @Column({ type: 'jsonb', nullable: true })
  webhookData?: any;

  @Column({ type: 'varchar', length: 500, nullable: true })
  redirectUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  callbackUrl?: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => PaymentGatewayEntity, (gateway) => gateway.transactions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'gatewayId' })
  gateway: PaymentGatewayEntity;

  @ManyToOne(() => InvoiceEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: InvoiceEntity | null;

  @ManyToOne(() => StudentEntity, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student?: StudentEntity | null;

  @ManyToOne(() => ParentEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: ParentEntity | null;
}
