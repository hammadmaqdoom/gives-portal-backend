import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { PaymentGatewayEntity } from './payment-gateway.entity';

@Entity({
  name: 'payment_gateway_credentials',
})
export class PaymentGatewayCredentialsEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  gatewayId: number;

  @Column({ type: 'varchar', length: 20, default: 'sandbox' })
  environment: 'sandbox' | 'production';

  @Column({ type: 'text' })
  apiKey: string;

  @Column({ type: 'text' })
  secretKey: string;

  @Column({ type: 'text', nullable: true })
  webhookSecret?: string;

  @Column({ type: 'jsonb', nullable: true })
  additionalConfig?: any;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => PaymentGatewayEntity, (gateway) => gateway.credentials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gatewayId' })
  gateway: PaymentGatewayEntity;
}
