import { Module } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommunicationsController],
  exports: [CommunicationsService],
  providers: [CommunicationsService],
})
export class CommunicationsModule {}
