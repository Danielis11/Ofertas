import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationChannel, NotificationStatus } from './entities/notification.entity';

export interface SendNotificationPayload {
  userId: string;
  title: string;
  message: string;
  channel?: NotificationChannel;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async send(payload: SendNotificationPayload): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      channel: payload.channel || NotificationChannel.IN_APP,
      status: NotificationStatus.SENT,
      isRead: false,
      data: payload.data || null,
    });

    const saved = await this.notifRepo.save(notif);
    this.logger.log(`[Notification Sent] To User: ${payload.userId} | "${payload.title}" via ${notif.channel}`);
    return saved;
  }

  async findByUser(userId: string, onlyUnread: boolean = false): Promise<Notification[]> {
    const where: any = { userId };
    if (onlyUnread) {
      where.isRead = false;
    }
    return this.notifRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({ where: { id, userId } });
    if (!notif) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }

    notif.isRead = true;
    notif.status = NotificationStatus.READ;
    return this.notifRepo.save(notif);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.notifRepo.update({ userId, isRead: false }, { isRead: true, status: NotificationStatus.READ });
    return { count: result.affected || 0 };
  }
}
