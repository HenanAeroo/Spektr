import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [JwtModule],
  providers: [EventsGateway, WsJwtGuard],
})
export class EventsModule {}
