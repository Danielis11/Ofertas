import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

export interface HealthResponse {
  status: string;
  service: string;
}

@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'api-gateway',
    };
  }
}
