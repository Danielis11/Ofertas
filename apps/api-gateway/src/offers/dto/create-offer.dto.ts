import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsUrl,
  IsNumber,
  Min,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({
    example: 'cfa3b869-99c7-4881-921e-885ee32e4c53',
    description: 'UUID of the associated product',
  })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    example: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    description: 'UUID of the store offering this item',
  })
  @IsUUID()
  @IsNotEmpty()
  storeId!: string;

  @ApiProperty({
    example: 'B098RKWH1Q',
    description: 'External product ID inside the store (ASIN, SKU, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  externalId!: string;

  @ApiProperty({
    example: 'https://www.amazon.com.mx/dp/B098RKWH1Q',
    description: 'Direct link to the offer',
  })
  @IsUrl()
  @IsNotEmpty()
  url!: string;

  @ApiProperty({
    example: 6499.0,
    description: 'Current price in store',
  })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    example: 'MXN',
    default: 'MXN',
    description: 'Currency code',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Stock availability flag',
  })
  @IsBoolean()
  @IsOptional()
  availability?: boolean;
}
