import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CartItemEntity } from './cart-item.entity';

@Entity({ name: 'cart' })
export class CartEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  userId?: number | null;

  @Index()
  @Column({ type: String, nullable: true })
  sessionId?: string | null;

  @Column({ type: String, default: 'USD' })
  currency: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => CartItemEntity, (item) => item.cart, { cascade: true })
  items?: CartItemEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

