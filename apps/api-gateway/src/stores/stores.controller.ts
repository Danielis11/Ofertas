import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nueva tienda comercial' })
  @ApiResponse({ status: 201, description: 'Tienda registrada exitosamente.' })
  @ApiResponse({ status: 409, description: 'La tienda ya existe.' })
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las tiendas disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de tiendas.' })
  findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar tienda por UUID' })
  @ApiParam({ name: 'id', description: 'UUID de la tienda' })
  @ApiResponse({ status: 200, description: 'Detalles de la tienda.' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada.' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar información de una tienda' })
  @ApiParam({ name: 'id', description: 'UUID de la tienda' })
  @ApiResponse({ status: 200, description: 'Tienda actualizada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return this.storesService.update(id, updateStoreDto);
  }
}
