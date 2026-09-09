import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  process.on('unhandledRejection', (reason: any) => {
    logger.warn(`Unhandled Promise Rejection caught: ${reason?.message || reason}`);
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error(`Uncaught Exception caught: ${err.message}`, err.stack);
  });

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_GATEWAY_PORT') || 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';

  // Security & Middleware
  app.enableCors();
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DealHunter API Gateway')
    .setDescription(
      'Documentación interactiva de la API para la plataforma DealHunter (Comparador y Detector Inteligente de Ofertas).',
    )
    .setVersion('1.0.0')
    .addTag('Health', 'Verificación de estado de los servicios')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`=================================================`);
  logger.log(`🚀 DealHunter API Gateway running on port: ${port}`);
  logger.log(`🔗 Health Check: http://localhost:${port}/${apiPrefix}/health`);
  logger.log(`📖 Swagger Docs: http://localhost:${port}/api/docs`);
  logger.log(`=================================================`);
}

bootstrap();
