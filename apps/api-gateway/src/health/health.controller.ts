import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from '../common/dto/health-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

export interface HealthResponse {
  status: string;
  service: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
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
}
