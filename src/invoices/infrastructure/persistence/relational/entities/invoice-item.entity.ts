import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { InvoiceEntity } from './invoice.entity';

@Entity({
  name: 'invoice_item',
})
export class InvoiceItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => InvoiceEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  invoice: InvoiceEntity;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
