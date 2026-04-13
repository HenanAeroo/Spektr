import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthTasks {
  constructor(private readonly prismaService: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async deleteTokens() {
    await this.prismaService.refreshToken.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
  }
}
