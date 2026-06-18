import { Injectable } from '@nestjs/common';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommunicationType,
  Prisma,
} from '../../prisma/generated/prisma/client';

@Injectable()
export class CommunicationsService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(dto: CreateCommunicationDto) {
    const comm = await this.prismaService.communication.create({
      data: {
        senderId: dto.senderId,
        recipientId: dto.recipientId,
        type: dto.type,
        subject: dto.subject,
        body: dto.body,
        score: dto.score,
      },
    });

    return comm;
  }

  async findAll(userId?: number, type?: CommunicationType) {
    const where: Prisma.CommunicationWhereInput = {};

    if (userId !== undefined) {
      where.OR = [{ senderId: userId }, { recipientId: userId }];
    }

    if (type !== undefined) {
      where.type = type;
    }

    return await this.prismaService.communication.findMany({
      where: where,
      include: {
        sender: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        recipient: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
