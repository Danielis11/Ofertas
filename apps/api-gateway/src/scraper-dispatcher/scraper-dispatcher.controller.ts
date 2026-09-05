import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ScraperDispatcherService } from './scraper-dispatcher.service';
import { DispatchTaskDto } from './dto/dispatch-task.dto';
import { JobSummaryDto, SchedulerStatusDto } from './dto/job-status.dto';

@ApiTags('Scraper Dispatcher')
@Controller('scraper')
export class ScraperDispatcherController {
  constructor(private readonly dispatcherService: ScraperDispatcherService) {}

  @Post('dispatch')
  @ApiOperation({ summary: 'Manually dispatch an on-demand scraping task to RabbitMQ' })
  @ApiResponse({
    status: 201,
    description: 'Scraping task dispatched successfully to worker spiders',
    type: JobSummaryDto,
  })
  async dispatchTask(@Body() dto: DispatchTaskDto): Promise<JobSummaryDto> {
    return this.dispatcherService.dispatch(dto, 'MANUAL');
  }

  @Get('status')
  @ApiOperation({ summary: 'Get automated cron scheduler status, active schedules and job counts' })
  @ApiResponse({
    status: 200,
    description: 'Scheduler status and active recurring jobs',
    type: SchedulerStatusDto,
  })
  async getStatus(): Promise<SchedulerStatusDto> {
    return this.dispatcherService.getStatus();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get recent scraper job dispatch history' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max records (default 20)' })
  @ApiResponse({
    status: 200,
    description: 'List of recent scraper jobs',
    type: [JobSummaryDto],
  })
  async getHistory(@Query('limit') limit?: number): Promise<JobSummaryDto[]> {
    return this.dispatcherService.getHistory(limit ? Number(limit) : 20);
  }
}
