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
import { Product } from '../../products/entities/product.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('offers')
@Index(['storeId', 'externalId'], { unique: true })
@Index(['productId'])
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, (store) => store.offers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ name: 'external_id', type: 'varchar', length: 150 })
  externalId!: string;

  @Column({ type: 'text' })
  url!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 10, default: 'MXN' })
  currency!: string;

  @Column({ type: 'boolean', default: true })
  availability!: boolean;

  @Column({ name: 'last_seen', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastSeen!: Date;

  @Column({ name: 'seller_name', type: 'varchar', length: 150, nullable: true })
  sellerName?: string;

  @Column({ name: 'is_official_store', type: 'boolean', default: false })
  isOfficialStore!: boolean;

  @Column({ name: 'deal_score', type: 'int', default: 50 })
  dealScore!: number;

  @Column({ name: 'savings_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  savingsPercentage!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
