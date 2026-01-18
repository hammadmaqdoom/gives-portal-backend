import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'feature_modules',
})
export class FeatureModuleEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, name: 'display_name' })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_enabled' })
  isEnabled: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'feature', name: 'module_type' })
  moduleType: 'feature' | 'settings_tab';

  @Column({ type: 'integer', default: 0, name: 'sort_order' })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
