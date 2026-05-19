import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer() server!: Server;

  private readonly logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    const token = client.handshake.auth.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: 'pong' };
  }
}
