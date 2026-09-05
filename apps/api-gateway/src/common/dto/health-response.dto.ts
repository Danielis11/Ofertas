import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
    description: 'Current health status of the service',
  })
  status!: string;

  @ApiProperty({
    example: 'api-gateway',
    description: 'Name of the microservice reporting status',
  })
  service!: string;

  @ApiProperty({
    example: '2026-09-05T13:30:00.000Z',
    description: 'ISO timestamp of the health check',
  })
  timestamp!: string;

  @ApiProperty({
    example: 'development',
    description: 'Current environment (development, test, production)',
  })
  environment!: string;
}
