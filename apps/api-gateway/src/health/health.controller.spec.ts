import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status ok with service name', () => {
    const result = controller.check();
    expect(result).toEqual({
      status: 'ok',
      service: 'api-gateway',
    });
  });

  it('should return system audit summary', async () => {
    const audit = await controller.getSystemAudit();
    expect(audit).toBeDefined();
    expect(audit.status).toBe('healthy');
    expect(audit.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(audit.version).toBe('1.0.0');
    expect(audit.memory).toBeDefined();
    expect(audit.infrastructure).toBeDefined();
    expect(audit.infrastructure.database).toBeDefined();
    expect(audit.infrastructure.redis).toBeDefined();
    expect(audit.infrastructure.rabbitmq).toBeDefined();
    expect(audit.infrastructure.websockets).toBeDefined();
  });
});

