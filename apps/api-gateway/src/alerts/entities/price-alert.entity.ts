import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  TRIGGERED = 'TRIGGERED',
  MUTED = 'MUTED',
}

@Entity('price_alerts')
@Index(['userId', 'productId'])
export class PriceAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'target_price', type: 'decimal', precision: 12, scale: 2 })
  targetPrice!: number;

  @Column({ type: 'varchar', length: 10, default: 'MXN' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status!: AlertStatus;

  @Column({ name: 'triggered_at', type: 'timestamptz', nullable: true })
  triggeredAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
