import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

export enum IdentifierType {
  EAN = 'EAN',
  UPC = 'UPC',
  ASIN = 'ASIN',
  SKU = 'SKU',
  GTIN = 'GTIN',
  EXTERNAL_ID = 'EXTERNAL_ID',
}

@Entity('product_identifiers')
@Index(['type', 'value'], { unique: true })
export class ProductIdentifier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.identifiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({
    type: 'enum',
    enum: IdentifierType,
    default: IdentifierType.SKU,
  })
  type!: IdentifierType;

  @Column({ type: 'varchar', length: 150 })
  value!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
