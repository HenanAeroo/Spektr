import { Injectable } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotifType,
  Outcome,
  Role,
  type Application,
} from '../../prisma/generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  create(
    createApplicationDto: CreateApplicationDto,
    userId: number,
  ): Promise<Application> {
    return this.prisma.application.create({
      data: {
        ...createApplicationDto,
        user: { connect: { id: userId } },
      },
    });
  }

  findMyApplications(userId: number) {
    return this.prisma.application.findMany({
      where: {
        userId: userId,
      },
    });
  }

  findOne(id: number, userId: number) {
    return this.prisma.application.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });
  }

  async update(
    id: number,
    updateApplicationDto: UpdateApplicationDto,
    userId: number,
  ) {
    const doc = await this.prisma.application.updateMany({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        ...updateApplicationDto,
      },
    });

    if (
      updateApplicationDto.outcome === Outcome.ENTRETIEN ||
      updateApplicationDto.outcome === Outcome.DECROCHEE
    ) {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN },
      });
      for (const admin of admins) {
        await this.notificationsService.createAndEmit(
          admin.id,
          NotifType.APPLICATION_STATUS,
          { studentId: userId, statut: updateApplicationDto.statut },
        );
      }
    }

    return doc;
  }

  remove(id: number, userId: number) {
    return this.prisma.application.deleteMany({
      where: {
        id: id,
        userId: userId,
      },
    });
  }
}
