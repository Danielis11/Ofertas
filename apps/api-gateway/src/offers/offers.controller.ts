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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar o actualizar oferta de una tienda',
    description: 'Guarda o actualiza el precio y disponibilidad de una oferta comercial.',
  })
  @ApiResponse({ status: 200, description: 'Oferta guardada o actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Producto o tienda no encontrados.' })
  upsert(@Body() createOfferDto: CreateOfferDto) {
    return this.offersService.upsertOffer(createOfferDto);
  }

  @Post('clean-stale')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Depurar ofertas inactivas o caducadas',
    description: 'Marca como no disponibles (availability = false) las ofertas sin actualización en más de maxAgeHours horas.',
  })
  @ApiQuery({ name: 'maxAgeHours', required: false, type: Number, description: 'Horas máximas de antigüedad (default: 48)' })
  @ApiResponse({ status: 200, description: 'Resultado de la limpieza de ofertas obsoletas.' })
  cleanStale(@Query('maxAgeHours') maxAgeHours?: string) {
    const hours = maxAgeHours ? parseInt(maxAgeHours, 10) : 48;
    return this.offersService.cleanStaleOffers(isNaN(hours) ? 48 : hours);
  }

  @Get('product/:productId')
  @ApiOperation({
    summary: 'Comparar ofertas de diferentes tiendas para un producto',
    description: 'Devuelve todas las ofertas activas ordenadas de menor a mayor precio.',
  })
  @ApiParam({ name: 'productId', description: 'UUID del producto canónico' })
  @ApiResponse({ status: 200, description: 'Lista de ofertas comparativas.' })
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.offersService.findByProductId(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una oferta por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la oferta' })
  @ApiResponse({ status: 200, description: 'Detalle de la oferta con tienda y producto.' })
  @ApiResponse({ status: 404, description: 'Oferta no encontrada.' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.offersService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una oferta por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la oferta' })
  @ApiResponse({ status: 204, description: 'Oferta eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Oferta no encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.offersService.remove(id);
  }
}
