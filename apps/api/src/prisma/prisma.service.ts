// prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({
      adapter,
      // Never serialize secret/account-state token columns to any consumer by
      // default (AC-09 / db-12). The few queries that legitimately need them
      // (email verification, password reset) re-include per-query via
      // `omit: { …: false }`.
      omit: {
        user: {
          verificationToken: true,
          verificationExpiry: true,
          resetPasswordToken: true,
          resetPasswordExpiry: true,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
