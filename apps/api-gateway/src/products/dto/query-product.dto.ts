import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max, IsUUID } from 'class-validator';

export class QueryProductDto {
  @ApiPropertyOptional({
    example: 'Nintendo Switch',
    description: 'Search keyword matching product name, brand, or model',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'Nintendo',
    description: 'Filter by exact brand name',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Filter by category UUID',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Number of items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
