import { Injectable, Logger } from '@nestjs/common';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotifType, Role, User } from '../../prisma/generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ObjectivesService {
  private readonly logger = new Logger(ObjectivesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateObjectiveDto) {
    const objective = await this.prismaService.objective.create({
      data: {
        promoId: dto.promoId,
        title: dto.title,
        description: dto.description,
        deadline: dto.deadline,
      },
    });

    const students = await this.prismaService.user.findMany({
      where: {
        promoId: dto.promoId,
        role: Role.STUDENT,
      },
    });

    try {
      await Promise.all(
        students.map((student) =>
          this.notificationsService.createAndEmit(
            student.id,
            NotifType.OBJECTIVE_CREATED,
            {
              objectiveId: objective.id,
              title: objective.title,
              description: objective.description,
              deadline: objective.deadline?.toISOString() ?? null,
            },
          ),
        ),
      );
    } catch (err) {
      this.logger.warn(`Notifications non envoyées pour l'objectif ${objective.id} : ${err}`);
    }

    return objective;
  }

  findAll() {
    return this.prismaService.objective.findMany({
      include: { promo: true },
    });
  }

  findOne(id: number) {
    return this.prismaService.objective.findUnique({
      where: { id },
    });
  }

  async findByUser(user: User) {
    if (user.promoId === null) {
      return [];
    }

    const objectives = await this.prismaService.objective.findMany({
      where: { promoId: user.promoId },
      include: {
        completions: {
          where: { userId: user.id },
          select: { done: true },
        },
      },
    });

    return objectives.map((obj) => ({
      ...obj,
      done: obj.completions[0]?.done ?? false,
      completions: undefined,
    }));
  }

  async toggleCompletion(objectiveId: number, userId: number) {
    const existing = await this.prismaService.objectiveCompletion.findUnique({
      where: { objectiveId_userId: { objectiveId, userId } },
    });

    if (existing) {
      return this.prismaService.objectiveCompletion.update({
        where: { objectiveId_userId: { objectiveId, userId } },
        data: { done: !existing.done },
      });
    }

    return this.prismaService.objectiveCompletion.create({
      data: { objectiveId, userId, done: true },
    });
  }

  async findAllCompletions() {
    const objectives = await this.prismaService.objective.findMany({
      include: {
        promo: true,
        completions: {
          include: {
            user: {
              select: { id: true, first_name: true, last_name: true, email: true, promoId: true },
            },
          },
        },
      },
    });

    return objectives;
  }

  update(id: number, dto: UpdateObjectiveDto) {
    return this.prismaService.objective.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prismaService.objective.delete({ where: { id } });
  }
}
