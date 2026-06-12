import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotifType } from '../../../prisma/generated/prisma/client';

@Injectable()
export class UsersTasks {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleInactivityAlert() {
    const threshold = new Date();

    threshold.setDate(threshold.getDate() - 7);

    const users = await this.prismaService.user.findMany({
      where: {
        last_seen_at: { not: null, lt: threshold },
        notifications: {
          none: {
            type: NotifType.INACTIVITY_ALERT,
            created_at: { gte: threshold },
          },
        },
      },
    });

    await Promise.all(
      users.map((user) =>
        this.notificationService.createAndEmit(
          user.id,
          NotifType.INACTIVITY_ALERT,
          { days: 7 },
        ),
      ),
    );
  }
}
