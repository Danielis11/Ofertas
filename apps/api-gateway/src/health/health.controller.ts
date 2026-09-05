import { Controller, Get, HttpCode, HttpStatus, Optional } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { EventsGateway } from '../websocket/events.gateway';
import { HealthResponseDto } from '../common/dto/health-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

export interface HealthResponse {
  status: string;
  service: string;
}

export interface SystemAuditResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  infrastructure: {
    database: { status: string; latencyMs: number };
    redis: { status: string };
    rabbitmq: { status: string };
    websockets: { status: string; activeClients: number };
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Optional() private readonly dataSource?: DataSource,
    @Optional() private readonly redisService?: RedisService,
    @Optional() private readonly rabbitmqService?: RabbitMQService,
    @Optional() private readonly eventsGateway?: EventsGateway,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'API Gateway Health Check',
    description: 'Returns the operational status of the API Gateway service.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API Gateway is healthy and running.',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
    type: ErrorResponseDto,
  })
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'api-gateway',
    };
  }

  @Get('system')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Full Infrastructure Health & Audit Dashboard',
    description: 'Returns latency, memory, and status for PostgreSQL, Redis, RabbitMQ, and WebSockets.',
  })
  async getSystemAudit(): Promise<SystemAuditResponse> {
    const mem = process.memoryUsage();

    // 1. Check PostgreSQL
    let dbStatus = 'disconnected';
    let dbLatency = -1;
    if (this.dataSource && this.dataSource.isInitialized) {
      const start = Date.now();
      try {
        await this.dataSource.query('SELECT 1');
        dbLatency = Date.now() - start;
        dbStatus = 'connected';
      } catch {
        dbStatus = 'error';
      }
    }

    // 2. Check Redis
    let redisStatus = 'disconnected';
    if (this.redisService) {
      const isPong = await this.redisService.ping();
      redisStatus = isPong ? 'connected' : 'unreachable';
    }

    // 3. Check RabbitMQ
    let rabbitStatus = 'disconnected';
    if (this.rabbitmqService) {
      rabbitStatus = this.rabbitmqService.isConnected() ? 'connected' : 'disconnected';
    }

    // 4. Check WebSockets
    const wsClients = this.eventsGateway ? this.eventsGateway.getActiveClientsCount() : 0;

    const isHealthy = dbStatus === 'connected' || !this.dataSource;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: {
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
      },
      infrastructure: {
        database: { status: dbStatus, latencyMs: dbLatency },
        redis: { status: redisStatus },
        rabbitmq: { status: rabbitStatus },
        websockets: { status: 'active', activeClients: wsClients },
      },
    };
  }
}

