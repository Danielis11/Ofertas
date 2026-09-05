import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationChannel, NotificationStatus } from './entities/notification.entity';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotifRepo: any;

  const sampleNotif = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Test Notification',
    message: 'Test Message',
    channel: NotificationChannel.IN_APP,
    status: NotificationStatus.SENT,
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockNotifRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((n) => Promise.resolve({ id: 'notif-1', ...n })),
      find: jest.fn().mockResolvedValue([sampleNotif]),
      findOne: jest.fn().mockResolvedValue(sampleNotif),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockNotifRepo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    it('should create and save a notification', async () => {
      const res = await service.send({
        userId: 'user-1',
        title: 'Price Drop!',
        message: 'Product price lowered',
      });

      expect(mockNotifRepo.create).toHaveBeenCalled();
      expect(mockNotifRepo.save).toHaveBeenCalled();
      expect(res.title).toBe('Price Drop!');
    });
  });

  describe('findByUser', () => {
    it('should return notifications list', async () => {
      const res = await service.findByUser('user-1', false);
      expect(res).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    it('should update isRead to true', async () => {
      const res = await service.markAsRead('user-1', 'notif-1');
      expect(res.isRead).toBe(true);
      expect(res.status).toBe(NotificationStatus.READ);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      mockNotifRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.markAsRead('user-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
