import { Injectable } from '@nestjs/common';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotifType, Role } from '../../prisma/generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ObjectivesService {
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

    await Promise.all(
      students.map((student) =>
        this.notificationsService.createAndEmit(
          student.id,
          NotifType.OBJECTIVE_CREATED,
          { objectiveId: objective.id, title: objective.title },
        ),
      ),
    );

    return objective;
  }

  findAll() {
    return this.prismaService.objective.findMany({
      include: { promo: true },
    });
  }

  findOne(id: number) {
    return this.prismaService.objective.findUnique({
      where: {
        id: id,
      },
    });
  }

  update(id: number, dto: UpdateObjectiveDto) {
    return this.prismaService.objective.update({
      where: { id: id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prismaService.objective.delete({ where: { id: id } });
  }
}
