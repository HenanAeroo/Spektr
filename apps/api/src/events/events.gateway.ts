import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: (
      requestOrigin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      callback(null, requestOrigin === process.env.FRONT_URL);
    },
    credentials: true,
  },
})
/**
 * Socket.IO gateway that pushes real-time notifications to connected clients.
 * CORS is locked to `FRONT_URL`. On connect, the JWT from the handshake is
 * verified and the socket joins a per-user room (`user:<id>`) so services can
 * target a single user with `server.to('user:<id>').emit(...)`.
 */
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  @WebSocketServer() server!: Server;

  private readonly logger = new Logger('EventsGateway');

  /**
   * Authenticates a new socket from its handshake token and subscribes it to the
   * user's private room. Sockets without a valid token are disconnected.
   *
   * @param client - The connecting Socket.IO client.
   */
  handleConnection(client: Socket) {
    const token = client.handshake.auth.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET'),
        algorithms: ['HS256'],
      });
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  /**
   * Logs a socket disconnection.
   *
   * @param client - The disconnecting Socket.IO client.
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Health-check handler: replies to a `ping` message with `pong`.
   *
   * @returns The `pong` event envelope.
   */
  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: 'pong' };
  }
}
