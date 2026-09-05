import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockServer: any;
  let mockSocket: any;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockSocket = {
      id: 'test-client-1',
      join: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsGateway],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    gateway.server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('connection & disconnection', () => {
    it('should track client connection and join deals stream room', () => {
      gateway.handleConnection(mockSocket as any);

      expect(gateway.getActiveClientsCount()).toBe(1);
      expect(mockSocket.join).toHaveBeenCalledWith('deals:stream');
    });

    it('should track client disconnection', () => {
      gateway.handleConnection(mockSocket as any);
      gateway.handleDisconnect(mockSocket as any);

      expect(gateway.getActiveClientsCount()).toBe(0);
    });
  });

  describe('room subscriptions', () => {
    it('should handle join_stream message', () => {
      const result = gateway.handleJoinStream(mockSocket as any);

      expect(mockSocket.join).toHaveBeenCalledWith('deals:stream');
      expect(result.status).toBe('joined_deals_stream');
    });

    it('should subscribe user to personal alert room', () => {
      const result = gateway.handleSubscribeUser(mockSocket as any, { userId: 'user-123' });

      expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
      expect(result.status).toBe('subscribed');
      expect(result.room).toBe('user:user-123');
    });
  });

  describe('broadcasting methods', () => {
    it('should broadcast deal_detected to deals:stream', () => {
      const dealData = { score: 95, grade: 'SUPER_DEAL' };
      gateway.broadcastDeal(dealData);

      expect(mockServer.to).toHaveBeenCalledWith('deals:stream');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'deal_detected',
        expect.objectContaining({
          type: 'DEAL_DETECTED',
          data: dealData,
        }),
      );
    });

    it('should broadcast price_dropped to deals:stream', () => {
      const priceData = { oldPrice: 6000, newPrice: 4500 };
      gateway.broadcastPriceDrop(priceData);

      expect(mockServer.to).toHaveBeenCalledWith('deals:stream');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'price_dropped',
        expect.objectContaining({
          type: 'PRICE_DROPPED',
          data: priceData,
        }),
      );
    });

    it('should send user alert to user personal room', () => {
      const alertData = { alertId: 'alt-1', targetPrice: 5000 };
      gateway.sendUserAlert('user-456', alertData);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-456');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'user_alert',
        expect.objectContaining({
          type: 'USER_ALERT_TRIGGERED',
          data: alertData,
        }),
      );
    });

    it('should broadcast scraper update to deals:stream', () => {
      const updateData = { store: 'amazon-mx', status: 'COMPLETED' };
      gateway.broadcastScraperUpdate(updateData);

      expect(mockServer.to).toHaveBeenCalledWith('deals:stream');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'scraper_update',
        expect.objectContaining({
          type: 'SCRAPER_UPDATE',
          data: updateData,
        }),
      );
    });
  });
});
