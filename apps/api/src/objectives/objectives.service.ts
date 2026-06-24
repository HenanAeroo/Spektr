import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotifType, Role, User } from '../../prisma/generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PromoAccessService, Requester } from '../promos/promo-access.service';

@Injectable()
export class ObjectivesService {
  private readonly logger = new Logger(ObjectivesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly promoAccess: PromoAccessService,
  ) {}

  /** Prisma filter restricting objectives to the promos the requester administers. */
  private promoScope(requester: Requester) {
    return requester.role === Role.SUPER_ADMIN
      ? {}
      : { promo: { adminPromos: { some: { adminId: requester.id } } } };
  }

  async create(dto: CreateObjectiveDto, requester: Requester) {
    await this.promoAccess.assertAdministersPromo(requester, dto.promoId);

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
      this.logger.warn(
        `Notifications non envoyées pour l'objectif ${objective.id} : ${String(err)}`,
      );
    }

    return objective;
  }

  findAll(requester: Requester) {
    return this.prismaService.objective.findMany({
      where: this.promoScope(requester),
      include: { promo: true },
    });
  }

  async findOne(id: number, requester: Requester) {
    const objective = await this.prismaService.objective.findUnique({
      where: { id },
    });
    if (objective) {
      await this.promoAccess.assertAdministersPromo(
        requester,
        objective.promoId,
      );
    }
    return objective;
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

  async toggleCompletion(objectiveId: number, user: User) {
    const objective = await this.prismaService.objective.findUnique({
      where: { id: objectiveId },
      select: { promoId: true },
    });
    // A completion may only be toggled for an objective in the user's own promo (AC-05).
    if (!objective || objective.promoId !== user.promoId) {
      throw new ForbiddenException('Objectif hors de votre promo');
    }

    const userId = user.id;
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

  async findAllCompletions(requester: Requester) {
    const objectives = await this.prismaService.objective.findMany({
      where: this.promoScope(requester),
      include: {
        promo: true,
        completions: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                promoId: true,
              },
            },
          },
        },
      },
    });

    return objectives;
  }

  async findRecentActivity(requester: Requester, limit = 5) {
    return this.prismaService.objectiveCompletion.findMany({
      where: {
        done: true,
        ...(requester.role === Role.SUPER_ADMIN
          ? {}
          : {
              objective: {
                promo: { adminPromos: { some: { adminId: requester.id } } },
              },
            }),
      },
      orderBy: { modified_at: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            promoId: true,
          },
        },
        objective: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async update(id: number, dto: UpdateObjectiveDto, requester: Requester) {
    const objective = await this.prismaService.objective.findUnique({
      where: { id },
      select: { promoId: true },
    });
    if (!objective) throw new ForbiddenException('Objectif introuvable');
    await this.promoAccess.assertAdministersPromo(requester, objective.promoId);

    return this.prismaService.objective.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, requester: Requester) {
    const objective = await this.prismaService.objective.findUnique({
      where: { id },
      select: { promoId: true },
    });
    if (!objective) throw new ForbiddenException('Objectif introuvable');
    await this.promoAccess.assertAdministersPromo(requester, objective.promoId);

    return this.prismaService.objective.delete({ where: { id } });
  }
}
