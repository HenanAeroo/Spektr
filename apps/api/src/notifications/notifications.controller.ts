import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import type { User } from '../../prisma/generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findAllForUser(user.id);
  }

  @Patch(':id/read')
  update(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationsService.markAsRead(+id, user.id);
  }
}
