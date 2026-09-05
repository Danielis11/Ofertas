import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobSummaryDto {
  @ApiProperty({ description: 'Unique task job ID' })
  jobId!: string;

  @ApiProperty({ description: 'Current status of the dispatched job' })
  status!: string;

  @ApiProperty({ description: 'Trigger source', enum: ['CRON', 'MANUAL'] })
  triggeredBy!: 'CRON' | 'MANUAL';

  @ApiProperty({ description: 'Target store' })
  storeSlug!: string;

  @ApiPropertyOptional({ description: 'Target category' })
  category?: string;

  @ApiPropertyOptional({ description: 'Target search query' })
  searchQuery?: string;

  @ApiProperty({ description: 'Job priority' })
  priority!: string;

  @ApiProperty({ description: 'Dispatched timestamp (ISO 8601)' })
  dispatchedAt!: string;
}

export class ScheduleInfo {
  @ApiProperty({ description: 'Schedule name' })
  name!: string;

  @ApiProperty({ description: 'Cron expression' })
  cron!: string;

  @ApiProperty({ description: 'Target store slug' })
  targetStore!: string;

  @ApiProperty({ description: 'Schedule description' })
  description!: string;
}

export class SchedulerStatusDto {
  @ApiProperty({ description: 'Whether the automated cron scraper scheduler is active' })
  schedulerEnabled!: boolean;

  @ApiProperty({ type: [ScheduleInfo], description: 'Configured automated scraping schedules' })
  activeSchedules!: ScheduleInfo[];

  @ApiProperty({ description: 'Total number of scraper jobs dispatched' })
  totalDispatchedJobs!: number;

  @ApiPropertyOptional({ description: 'Last dispatch timestamp' })
  lastDispatchedAt?: string;
}
