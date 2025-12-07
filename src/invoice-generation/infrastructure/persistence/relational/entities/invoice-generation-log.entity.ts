import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'invoice_generation_log',
})
export class InvoiceGenerationLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  studentId: number;

  @Index()
  @Column({ type: 'int' })
  classId: number;

  @Column({ type: 'int', nullable: true })
  invoiceId?: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ['monthly', 'quarterly', 'yearly', 'manual'],
  })
  generationType: 'monthly' | 'quarterly' | 'yearly' | 'manual';

  @Index()
  @Column({
    type: 'enum',
    enum: ['success', 'failed', 'skipped'],
    default: 'success',
  })
  status: 'success' | 'failed' | 'skipped';

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
