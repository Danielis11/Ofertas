import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class CreatePriceAlertDto {
  @ApiProperty({ example: '097fe96b-9a2a-42f6-88f6-3521cd39cf34', description: 'Product UUID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 4200.00, description: 'Target price threshold to trigger alert' })
  @IsNumber()
  @IsPositive()
  targetPrice!: number;

  @ApiProperty({ example: 'MXN', required: false, description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;
}
