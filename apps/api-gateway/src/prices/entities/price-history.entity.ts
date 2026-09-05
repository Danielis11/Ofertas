import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Offer } from '../../offers/entities/offer.entity';

@Entity('price_history')
@Index(['offerId', 'recordedAt'])
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'offer_id', type: 'uuid' })
  offerId!: string;

  @ManyToOne(() => Offer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offer_id' })
  offer!: Offer;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 10, default: 'MXN' })
  currency!: string;

  @CreateDateColumn({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;
}
