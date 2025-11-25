import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { PaymentGatewayCredentialsEntity } from './payment-gateway-credentials.entity';
import { PaymentTransactionEntity } from './payment-transaction.entity';

@Entity({
  name: 'payment_gateway',
})
export class PaymentGatewayEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'text', array: true, default: '{}' })
  supportedCurrencies: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  supportedCountries: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxAmount?: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.0 })
  processingFee: number;

  @Column({ type: 'varchar', length: 20, default: 'percentage' })
  processingFeeType: 'percentage' | 'fixed';

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  configSchema?: any;

  @Column({ type: 'varchar', length: 500, nullable: true })
  webhookUrl?: string;

  @Column({ type: 'boolean', default: true })
  testMode: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(
    () => PaymentGatewayCredentialsEntity,
    (credentials) => credentials.gateway,
  )
  credentials: PaymentGatewayCredentialsEntity[];

  @OneToMany(
    () => PaymentTransactionEntity,
    (transaction) => transaction.gateway,
  )
  transactions: PaymentTransactionEntity[];
}
