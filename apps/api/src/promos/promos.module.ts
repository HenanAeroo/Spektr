import { Module } from '@nestjs/common';
import { PromosService } from './promos.service';
import { PromosController } from './promos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PromosController],
  providers: [PromosService],
})
export class PromosModule {}
