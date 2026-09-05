import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { StoreStatus } from '../entities/store.entity';

export class CreateStoreDto {
  @ApiProperty({ example: 'Amazon México', description: 'Store name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'amazon-mx', description: 'Unique slug for URL routing' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug!: string;

  @ApiProperty({ example: 'amazon.com.mx', description: 'Primary domain of the store' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  domain!: string;

  @ApiPropertyOptional({
    example: 'https://assets.example.com/amazon-logo.png',
    description: 'Logo image URL',
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({
    enum: StoreStatus,
    default: StoreStatus.ACTIVE,
    description: 'Status of the store',
  })
  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;
}
