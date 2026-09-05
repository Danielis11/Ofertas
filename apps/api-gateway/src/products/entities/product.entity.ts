import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductIdentifier } from './product-identifier.entity';

@Entity('products')
@Index(['brand'])
@Index(['normalizedName'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'normalized_name', type: 'varchar', length: 255 })
  normalizedName!: string;

  @Column({ type: 'varchar', length: 100 })
  brand!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  model?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  image?: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @OneToMany(
    () => ProductIdentifier,
    (identifier) => identifier.product,
    { cascade: true },
  )
  identifiers!: ProductIdentifier[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
