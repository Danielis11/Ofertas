import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IdentifierType } from '../entities/product-identifier.entity';

export class CreateProductIdentifierDto {
  @ApiProperty({
    enum: IdentifierType,
    example: IdentifierType.EAN,
    description: 'Identifier type (EAN, UPC, ASIN, SKU, GTIN, EXTERNAL_ID)',
  })
  @IsEnum(IdentifierType)
  type!: IdentifierType;

  @ApiProperty({
    example: '0045496883386',
    description: 'Unique identifier code',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  value!: string;
}

export class CreateProductDto {
  @ApiProperty({
    example: 'Nintendo Switch OLED 64GB Blanco',
    description: 'Canonical name of the product',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: 'Nintendo',
    description: 'Brand or manufacturer',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand!: string;

  @ApiPropertyOptional({
    example: 'OLED White',
    description: 'Product model or variant',
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  model?: string;

  @ApiPropertyOptional({
    example: 'Consola Nintendo Switch con pantalla OLED de 7 pulgadas...',
    description: 'Product description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://images.example.com/switch-oled.jpg',
    description: 'Main product image URL',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'UUID of associated Category',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    type: [CreateProductIdentifierDto],
    description: 'List of product identifiers (EAN, UPC, ASIN, SKU)',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateProductIdentifierDto)
  identifiers?: CreateProductIdentifierDto[];
}
