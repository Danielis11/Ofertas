import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScraperDispatcherService } from './scraper-dispatcher.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { StoresService } from '../stores/stores.service';
import { RedisService } from '../redis/redis.service';
import { ScrapePriority } from './dto/dispatch-task.dto';
import { DealHunterEvents, RABBITMQ_ROUTING_KEYS } from '@dealhunter/shared-events';

describe('ScraperDispatcherService', () => {
  let service: ScraperDispatcherService;
  let mockRabbitMQService: any;
  let mockStoresService: any;
  let mockRedisService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockRabbitMQService = {
      publishEvent: jest.fn().mockResolvedValue(true),
    };

    mockStoresService = {
      findBySlug: jest.fn((slug: string) => {
        if (slug === 'amazon-mx' || slug === 'mercado-libre-mx' || slug === 'walmart-mx') {
          return Promise.resolve({ id: 'store-uuid-1', name: 'Amazon México', slug });
        }
        return Promise.resolve(null);
      }),
    };

    mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'SCRAPER_CRON_ENABLED') return 'true';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperDispatcherService,
        { provide: RabbitMQService, useValue: mockRabbitMQService },
        { provide: StoresService, useValue: mockStoresService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ScraperDispatcherService>(ScraperDispatcherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatch', () => {
    it('should dispatch a scraping task to RabbitMQ and store in Redis', async () => {
      const result = await service.dispatch(
        {
          storeSlug: 'amazon-mx',
          searchQuery: 'nintendo switch',
          category: 'videojuegos',
          priority: ScrapePriority.HIGH,
          maxItems: 25,
        },
        'MANUAL',
      );

      expect(mockStoresService.findBySlug).toHaveBeenCalledWith('amazon-mx');
      expect(mockRabbitMQService.publishEvent).toHaveBeenCalledWith(
        RABBITMQ_ROUTING_KEYS.SCRAPE_TASK,
        expect.objectContaining({
          eventName: DealHunterEvents.SCRAPE_TASK_REQUESTED,
          source: 'dealhunter-api-gateway',
          payload: expect.objectContaining({
            storeSlug: 'amazon-mx',
            searchQuery: 'nintendo switch',
            priority: ScrapePriority.HIGH,
            triggeredBy: 'MANUAL',
          }),
        }),
      );

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'scraper:jobs:history',
        expect.any(Array),
      );

      expect(result.status).toBe('DISPATCHED');
      expect(result.triggeredBy).toBe('MANUAL');
      expect(result.storeSlug).toBe('amazon-mx');
      expect(result.jobId).toBeDefined();
    });

    it('should throw NotFoundException if store does not exist', async () => {
      await expect(
        service.dispatch({ storeSlug: 'non-existent-store' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockRabbitMQService.publishEvent).not.toHaveBeenCalled();
    });
  });

  describe('handleHourlyScrapingSchedule', () => {
    it('should dispatch automated cron tasks for top stores', async () => {
      await service.handleHourlyScrapingSchedule();

      // Dispatches 3 stores: amazon-mx, mercado-libre-mx, walmart-mx
      expect(mockRabbitMQService.publishEvent).toHaveBeenCalledTimes(3);
    });

    it('should skip if cron is disabled in config', async () => {
      mockConfigService.get.mockReturnValueOnce('false');

      await service.handleHourlyScrapingSchedule();

      expect(mockRabbitMQService.publishEvent).not.toHaveBeenCalled();
    });
  });

  describe('getHistory & getStatus', () => {
    it('should return recent jobs from Redis', async () => {
      const mockHistory = [{ jobId: 'j1' }, { jobId: 'j2' }];
      mockRedisService.get.mockResolvedValueOnce(mockHistory);

      const history = await service.getHistory(10);

      expect(history).toEqual(mockHistory);
    });

    it('should return scheduler status with configured schedules and counts', async () => {
      mockRedisService.get
        .mockResolvedValueOnce(42) // total count
        .mockResolvedValueOnce('2026-09-05T22:30:00.000Z'); // last dispatched

      const status = await service.getStatus();

      expect(status.schedulerEnabled).toBe(true);
      expect(status.totalDispatchedJobs).toBe(42);
      expect(status.lastDispatchedAt).toBe('2026-09-05T22:30:00.000Z');
      expect(status.activeSchedules.length).toBeGreaterThan(0);
    });
  });
});
