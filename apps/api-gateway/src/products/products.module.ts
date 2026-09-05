import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductIdentifier } from './entities/product-identifier.entity';
import { Category } from './entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductIdentifier, Category]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
