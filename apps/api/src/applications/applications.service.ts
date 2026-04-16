import { Injectable } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { Application } from '../../prisma/generated/prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

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

  update(
    id: number,
    updateApplicationDto: UpdateApplicationDto,
    userId: number,
  ) {
    return this.prisma.application.updateMany({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        ...updateApplicationDto,
      },
    });
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
