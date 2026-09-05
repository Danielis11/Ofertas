import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { IdentifierType } from './entities/product-identifier.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nuevo producto canónico',
    description: 'Registra un producto con su marca, modelo e identificadores (EAN, UPC, ASIN).',
  })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 409, description: 'Uno de los identificadores ya existe.' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Buscar y listar productos con paginación',
    description: 'Permite buscar por texto (nombre, marca o modelo) y filtrar por categoría con paginación.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de productos.' })
  findAll(@Query() queryDto: QueryProductDto) {
    return this.productsService.findAll(queryDto);
  }

  @Get('by-identifier')
  @ApiOperation({
    summary: 'Buscar producto por identificador comercial (EAN, UPC, ASIN)',
    description: 'Utilizado por scrapers y servicios para matching exacto de productos.',
  })
  @ApiQuery({ name: 'type', enum: IdentifierType, example: IdentifierType.ASIN })
  @ApiQuery({ name: 'value', example: 'B098RKWH1Q' })
  @ApiResponse({ status: 200, description: 'Producto encontrado o null si no existe.' })
  findByIdentifier(
    @Query('type') type: IdentifierType,
    @Query('value') value: string,
  ) {
    return this.productsService.findByIdentifier(type, value);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un producto por ID',
  })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: 'Detalle del producto con sus identificadores.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un producto por ID',
  })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 204, description: 'Producto eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
