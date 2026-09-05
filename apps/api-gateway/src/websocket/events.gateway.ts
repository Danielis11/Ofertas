import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedClientsCount = 0;

  handleConnection(client: Socket) {
    this.connectedClientsCount++;
    this.logger.log(`Client connected: ${client.id} | Total active: ${this.connectedClientsCount}`);
    // Auto-join public stream
    client.join('deals:stream');
  }

  handleDisconnect(client: Socket) {
    this.connectedClientsCount = Math.max(0, this.connectedClientsCount - 1);
    this.logger.log(`Client disconnected: ${client.id} | Total active: ${this.connectedClientsCount}`);
  }

  @SubscribeMessage('join_stream')
  handleJoinStream(@ConnectedSocket() client: Socket): { status: string } {
    client.join('deals:stream');
    return { status: 'joined_deals_stream' };
  }

  @SubscribeMessage('subscribe_user')
  handleSubscribeUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ): { status: string; room: string } {
    if (data?.userId) {
      const room = `user:${data.userId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined personal alert room: ${room}`);
      return { status: 'subscribed', room };
    }
    return { status: 'invalid_user_id', room: '' };
  }

  /**
   * Broadcast new deal or price evaluation to all connected users
   */
  broadcastDeal(dealData: any): void {
    if (!this.server) return;
    this.server.to('deals:stream').emit('deal_detected', {
      type: 'DEAL_DETECTED',
      timestamp: new Date().toISOString(),
      data: dealData,
    });
  }

  /**
   * Broadcast price drop event to live ticker
   */
  broadcastPriceDrop(priceData: any): void {
    if (!this.server) return;
    this.server.to('deals:stream').emit('price_dropped', {
      type: 'PRICE_DROPPED',
      timestamp: new Date().toISOString(),
      data: priceData,
    });
  }

  /**
   * Send targeted alert directly to specific user
   */
  sendUserAlert(userId: string, alertData: any): void {
    if (!this.server) return;
    const room = `user:${userId}`;
    this.server.to(room).emit('user_alert', {
      type: 'USER_ALERT_TRIGGERED',
      timestamp: new Date().toISOString(),
      data: alertData,
    });
  }

  /**
   * Broadcast scraper status update
   */
  broadcastScraperUpdate(updateData: any): void {
    if (!this.server) return;
    this.server.to('deals:stream').emit('scraper_update', {
      type: 'SCRAPER_UPDATE',
      timestamp: new Date().toISOString(),
      data: updateData,
    });
  }

  getActiveClientsCount(): number {
    return this.connectedClientsCount;
  }
}
