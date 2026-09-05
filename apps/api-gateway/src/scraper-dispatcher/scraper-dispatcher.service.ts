import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  DealHunterEvents,
  BaseEvent,
  ScrapeTaskPayload,
  RABBITMQ_ROUTING_KEYS,
} from '@dealhunter/shared-events';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { StoresService } from '../stores/stores.service';
import { RedisService } from '../redis/redis.service';
import { DispatchTaskDto, ScrapePriority } from './dto/dispatch-task.dto';
import { JobSummaryDto, SchedulerStatusDto, ScheduleInfo } from './dto/job-status.dto';

@Injectable()
export class ScraperDispatcherService {
  private readonly logger = new Logger(ScraperDispatcherService.name);

  private readonly configuredSchedules: ScheduleInfo[] = [
    {
      name: 'Amazon Mexico Hourly Deals',
      cron: '0 * * * *',
      targetStore: 'amazon-mx',
      description: 'Crawls top electronics deals and discounted items from Amazon Mexico every hour',
    },
    {
      name: 'Mercado Libre Electronics Crawl',
      cron: '15 * * * *',
      targetStore: 'mercado-libre-mx',
      description: 'Crawls top trending smartphones and computers every hour from Mercado Libre',
    },
    {
      name: 'Walmart Mexico Tech Refresh',
      cron: '30 * * * *',
      targetStore: 'walmart-mx',
      description: 'Crawls tech and gaming rollback deals from Walmart Mexico every hour',
    },
  ];

  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly storesService: StoresService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Automated hourly cron job to scrape top stores and discover new deals.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyScrapingSchedule(): Promise<void> {
    const isCronEnabled = this.configService.get<string>('SCRAPER_CRON_ENABLED', 'true') === 'true';
    if (!isCronEnabled) {
      this.logger.log('Automated scraper cron schedule is disabled by configuration.');
      return;
    }

    this.logger.log('⏰ Starting automated hourly scraping cycle across registered stores...');

    const defaultJobs: DispatchTaskDto[] = [
      {
        storeSlug: 'amazon-mx',
        searchQuery: 'ofertas del dia',
        category: 'electronica',
        priority: ScrapePriority.NORMAL,
        maxItems: 30,
      },
      {
        storeSlug: 'mercado-libre-mx',
        searchQuery: 'ofertas relampago',
        category: 'computacion',
        priority: ScrapePriority.NORMAL,
        maxItems: 30,
      },
      {
        storeSlug: 'walmart-mx',
        searchQuery: 'liquidaciones',
        category: 'tecnologia',
        priority: ScrapePriority.NORMAL,
        maxItems: 30,
      },
    ];

    for (const job of defaultJobs) {
      try {
        await this.dispatch(job, 'CRON');
      } catch (err: any) {
        this.logger.error(`Automated dispatch failed for ${job.storeSlug}: ${err.message}`);
      }
    }
  }

  /**
   * Dispatches a scraping task to RabbitMQ for Python Scrapy spiders to execute.
   */
  async dispatch(
    dto: DispatchTaskDto,
    triggeredBy: 'CRON' | 'MANUAL' = 'MANUAL',
  ): Promise<JobSummaryDto> {
    // 1. Verify store exists
    const store = await this.storesService.findBySlug(dto.storeSlug);
    if (!store) {
      throw new NotFoundException(`Store with slug "${dto.storeSlug}" not found`);
    }

    const jobId = crypto.randomUUID();
    const dispatchedAt = new Date().toISOString();

    const payload: ScrapeTaskPayload = {
      storeSlug: dto.storeSlug,
      category: dto.category,
      searchQuery: dto.searchQuery,
      urls: dto.urls,
      priority: dto.priority || ScrapePriority.NORMAL,
      maxItems: dto.maxItems || 50,
      triggeredBy,
      dispatchedAt,
    };

    const event: BaseEvent<ScrapeTaskPayload> = {
      eventId: jobId,
      eventName: DealHunterEvents.SCRAPE_TASK_REQUESTED,
      timestamp: dispatchedAt,
      source: 'dealhunter-api-gateway',
      payload,
    };

    // 2. Publish event to RabbitMQ
    await this.rabbitmqService.publishEvent(RABBITMQ_ROUTING_KEYS.SCRAPE_TASK, event);

    const summary: JobSummaryDto = {
      jobId,
      status: 'DISPATCHED',
      triggeredBy,
      storeSlug: dto.storeSlug,
      category: dto.category,
      searchQuery: dto.searchQuery,
      priority: dto.priority || ScrapePriority.NORMAL,
      dispatchedAt,
    };

    // 3. Persist stats and history in Redis
    try {
      const historyKey = 'scraper:jobs:history';
      const countKey = 'scraper:jobs:total_count';
      const lastKey = 'scraper:jobs:last_dispatched_at';

      await this.redisService.set(lastKey, dispatchedAt);
      
      const currentCount = (await this.redisService.get<number>(countKey)) || 0;
      await this.redisService.set(countKey, currentCount + 1);

      const existingHistory = (await this.redisService.get<JobSummaryDto[]>(historyKey)) || [];
      existingHistory.unshift(summary);
      // Keep recent 50 jobs
      const trimmedHistory = existingHistory.slice(0, 50);
      await this.redisService.set(historyKey, trimmedHistory);
    } catch (err: any) {
      this.logger.warn(`Could not save dispatch stats to Redis: ${err.message}`);
    }

    this.logger.log(
      `[Scraper Task Dispatched] -> Job ID: ${jobId} | Store: ${dto.storeSlug} | Query: "${dto.searchQuery || ''}" | Trigger: ${triggeredBy}`,
    );

    return summary;
  }

  /**
   * Retrieves recent dispatched job history.
   */
  async getHistory(limit = 20): Promise<JobSummaryDto[]> {
    const historyKey = 'scraper:jobs:history';
    const history = (await this.redisService.get<JobSummaryDto[]>(historyKey)) || [];
    return history.slice(0, limit);
  }

  /**
   * Retrieves status and configuration of the scraper scheduler.
   */
  async getStatus(): Promise<SchedulerStatusDto> {
    const isCronEnabled = this.configService.get<string>('SCRAPER_CRON_ENABLED', 'true') === 'true';
    const countKey = 'scraper:jobs:total_count';
    const lastKey = 'scraper:jobs:last_dispatched_at';

    const totalDispatchedJobs = (await this.redisService.get<number>(countKey)) || 0;
    const lastDispatchedAt = (await this.redisService.get<string>(lastKey)) || undefined;

    return {
      schedulerEnabled: isCronEnabled,
      activeSchedules: this.configuredSchedules,
      totalDispatchedJobs,
      lastDispatchedAt,
    };
  }
}
