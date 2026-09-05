import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './../src/app.module';

describe('API Gateway (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');

    const swaggerConfig = new DocumentBuilder()
      .setTitle('DealHunter API Gateway')
      .setDescription('DealHunter API')
      .setVersion('1.0.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET) should return 200 OK', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'api-gateway',
      });
  });

  it('/api/docs (GET) should return 200 OK with Swagger UI', () => {
    return request(app.getHttpServer())
      .get('/api/docs')
      .expect(200)
      .expect('Content-Type', /html/);
  });

  it('unhandled route should return standardized 404 JSON format from HttpExceptionFilter', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/not-existent-route')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/api/v1/not-existent-route',
      method: 'GET',
      error: 'Not Found',
    });
    expect(response.body.timestamp).toBeDefined();
  });
});
