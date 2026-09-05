import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceAlert, AlertStatus } from './entities/price-alert.entity';
import { CreatePriceAlertDto } from './dto/create-alert.dto';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/entities/notification.entity';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(PriceAlert)
    private readonly alertRepo: Repository<PriceAlert>,
    private readonly productsService: ProductsService,
    private readonly notifService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreatePriceAlertDto): Promise<PriceAlert> {
    // Validate product existence
    await this.productsService.findById(dto.productId);

    const alert = this.alertRepo.create({
      userId,
      productId: dto.productId,
      targetPrice: dto.targetPrice,
      currency: dto.currency || 'MXN',
      status: AlertStatus.ACTIVE,
    });

    return this.alertRepo.save(alert);
  }

  async findByUser(userId: string): Promise<PriceAlert[]> {
    return this.alertRepo.find({
      where: { userId },
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const alert = await this.alertRepo.findOne({ where: { id, userId } });
    if (!alert) {
      throw new NotFoundException(`Alert with ID '${id}' not found`);
    }
    await this.alertRepo.remove(alert);
  }

  /**
   * Called by price drop events to trigger matching active user alerts
   */
  async checkAlertsForProductPrice(productId: string, newPrice: number): Promise<PriceAlert[]> {
    const alerts = await this.alertRepo.find({
      where: { productId, status: AlertStatus.ACTIVE },
      relations: { user: true, product: true },
    });

    const triggered: PriceAlert[] = [];

    for (const alert of alerts) {
      if (Number(newPrice) <= Number(alert.targetPrice)) {
        alert.status = AlertStatus.TRIGGERED;
        alert.triggeredAt = new Date();
        await this.alertRepo.save(alert);
        triggered.push(alert);
        this.logger.log(`[ALERT TRIGGERED] User ${alert.user?.email || alert.userId} notified for product ${alert.productId}: Target was $${alert.targetPrice}, now $${newPrice}`);

        // Dispatch real-time notification
        await this.notifService.send({
          userId: alert.userId,
          title: `¡Alerta de Precio Activada!`,
          message: `El producto "${alert.product?.name || 'que sigues'}" ha bajado a $${newPrice} ${alert.currency} (tu meta era $${alert.targetPrice}).`,
          channel: NotificationChannel.IN_APP,
          data: {
            alertId: alert.id,
            productId: alert.productId,
            targetPrice: alert.targetPrice,
            currentPrice: newPrice,
          },
        });
      }
    }

    return triggered;
  }
}
