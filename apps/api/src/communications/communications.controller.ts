import {
  Controller,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CommunicationType, Role } from '../../prisma/generated/prisma/client';

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(
    @Query('userId', new ParseIntPipe({ optional: true })) userId: number,
    @Query('type', new ParseEnumPipe(CommunicationType, { optional: true }))
    type: CommunicationType | undefined,
  ) {
    return await this.communicationsService.findAll(userId, type);
  }
}
