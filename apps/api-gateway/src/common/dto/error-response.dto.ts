import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404, description: 'HTTP Status code' })
  statusCode!: number;

  @ApiProperty({ example: '2026-09-05T13:30:00.000Z', description: 'Timestamp of the error' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/resource', description: 'Request path' })
  path!: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method' })
  method!: string;

  @ApiProperty({ example: 'Resource not found', description: 'Error message' })
  message!: string | string[];

  @ApiProperty({ example: 'Not Found', description: 'Error classification' })
  error!: string;
}
