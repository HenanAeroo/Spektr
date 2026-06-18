import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { UsersTasks } from './tasks/users.tasks';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    NotificationsModule,
    MailModule,
    PrismaModule,
    CommunicationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersTasks],
  exports: [UsersService],
})
export class UsersModule {}
