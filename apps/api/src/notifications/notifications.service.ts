import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { Prisma, NotifType } from '../../prisma/generated/prisma/client';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly mailerService: MailerService,
  ) {}

  async createAndEmit(
    userId: number,
    type: NotifType,
    payload: Record<string, unknown>,
  ) {
    const notif = await this.prisma.notification.create({
      data: {
        userId,
        type,
        payload: payload as Prisma.InputJsonValue,
        read: false,
      },
    });

    const userMail = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    await this.mailerService.sendMail({
      to: userMail?.email,
      subject: 'Nouvelle notification Spektr',
      text: `Vous avez reçu une notification : ${type}`,
    });

    this.eventsGateway.server.to(`user:${userId}`).emit('notification', notif);

    return notif;
  }

  async findAllForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }
}
