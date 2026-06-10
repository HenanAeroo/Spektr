import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Role } from '../../prisma/generated/prisma/client';

@Injectable()
export class PromosService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}

  create(dto: CreatePromoDto) {
    return this.prismaService.promo.create({
      data: {
        name: dto.name,
      },
    });
  }

  findAll() {
    return this.prismaService.promo.findMany();
  }

  findOne(id: number) {
    return this.prismaService.promo.findUnique({
      where: {
        id: id,
      },
    });
  }

  update(id: number, dto: UpdatePromoDto) {
    return this.prismaService.promo.update({
      where: {
        id: id,
      },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prismaService.promo.delete({ where: { id: id } });
  }

  assignUser(promoId: number, userId: number) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { promoId: promoId },
    });
  }

  async sendEmail(id: number, subject: string, body: string) {
    const promo = await this.prismaService.promo.findUnique({
      where: { id: id },
    });

    if (promo === null) {
      throw new NotFoundException('Promo not found');
    }

    const students = await this.prismaService.user.findMany({
      where: { promoId: id, role: Role.STUDENT },
    });

    return Promise.all(
      students.map((u) => this.mailService.send(u.email, subject, body)),
    );
  }
}
