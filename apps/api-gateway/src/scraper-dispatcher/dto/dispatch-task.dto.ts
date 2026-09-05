import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsNumber, Min, Max } from 'class-validator';

export enum ScrapePriority {
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

export class DispatchTaskDto {
  @ApiProperty({
    description: 'Target store slug (e.g. amazon-mx, mercado-libre-mx, walmart-mx)',
    example: 'amazon-mx',
  })
  @IsString()
  @IsNotEmpty()
  storeSlug!: string;

  @ApiPropertyOptional({
    description: 'Product category or department to scrape',
    example: 'electronica',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Search keyword/query to scrape deals for',
    example: 'nintendo switch oled',
  })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiPropertyOptional({
    description: 'List of specific product URLs to scrape and refresh prices for',
    example: ['https://www.amazon.com.mx/dp/B098RKWH1Q'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  urls?: string[];

  @ApiPropertyOptional({
    description: 'Task priority in scraper queue',
    enum: ScrapePriority,
    default: ScrapePriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(ScrapePriority)
  priority?: ScrapePriority = ScrapePriority.NORMAL;

  @ApiPropertyOptional({
    description: 'Maximum items to extract',
    default: 50,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  maxItems?: number = 50;
}
