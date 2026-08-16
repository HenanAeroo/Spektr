import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import type { User } from '../../prisma/generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Notification endpoints under `/notifications`, all JWT-guarded and scoped to
 * the authenticated user's own notifications.
 */
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * `GET /notifications` — lists the caller's notifications, newest first.
   *
   * @param user - The authenticated user (injected).
   * @returns The user's notifications.
   */
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findAllForUser(user.id);
  }

  /**
   * `PATCH /notifications/mark-all-read` — marks all of the caller's
   * notifications as read.
   *
   * @param user - The authenticated user (injected).
   * @returns Prisma batch payload with the updated count.
   */
  @Patch('/mark-all-read')
  markAllread(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id);
  }

  /**
   * `PATCH /notifications/:id/read` — marks a single owned notification as read.
   *
   * @param id - Notification id (path).
   * @param user - The authenticated user (injected).
   * @returns Prisma batch payload with the updated count.
   */
  @Patch(':id/read')
  update(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }
}
