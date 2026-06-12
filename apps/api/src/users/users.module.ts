import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { UsersTasks } from './tasks/users.tasks';

@Module({
  imports: [NotificationsModule, MailModule],
  controllers: [UsersController],
  providers: [UsersService, UsersTasks],
  exports: [UsersService],
})
export class UsersModule {}
