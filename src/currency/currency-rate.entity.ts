import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity({ name: 'currency_rate' })
@Unique(['base', 'date'])
export class CurrencyRateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  @Index()
  date: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 3 })
  base: string; // Base currency (e.g., USD)

  @Column({ type: 'bigint', nullable: true })
  timestamp?: number; // provider timestamp (seconds)

  @Column({ type: 'varchar', length: 64, default: 'openexchangerates' })
  provider: string;

  @Column({ type: 'jsonb' })
  rates: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


