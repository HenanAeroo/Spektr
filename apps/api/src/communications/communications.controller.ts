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

/**
 * Read-only communications history under `/communications`, admin-only. Lets an
 * admin audit the emails and feedback sent to students.
 */
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  /**
   * `GET /communications` — admin-only; lists communications, optionally filtered
   * by `userId` and/or `type`.
   *
   * @param userId - Optional participant filter (query).
   * @param type - Optional communication type filter (query).
   * @returns The matching communications with participant info.
   */
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
