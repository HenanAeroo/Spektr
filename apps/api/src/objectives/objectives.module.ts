import { Module } from '@nestjs/common';
import { ObjectivesService } from './objectives.service';
import { ObjectivesController } from './objectives.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ObjectivesController],
  providers: [ObjectivesService],
})
export class ObjectivesModule {}
