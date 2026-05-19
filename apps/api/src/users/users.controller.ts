import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import type { User as UserModel } from '../../prisma/generated/prisma/client';
import { Role as RoleModel } from '../../prisma/generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  findAll(
    @Query() query: { skip?: string; take?: string },
  ): Promise<UserModel[]> {
    return this.usersService.findAll({
      orderBy: { id: 'asc' },
      take: query.take ? Number(query.take) : 20,
      skip: query.skip ? Number(query.skip) : undefined,
    });
  }

  @Get('me')
  me(@CurrentUser() user: UserModel): UserModel {
    return user;
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserModel | null> {
    return this.usersService.findOne({ id: Number(id) });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserModel,
  ): Promise<UserModel> {
    if (user.id !== Number(id)) throw new ForbiddenException();

    return this.usersService.update({
      where: { id: Number(id) },
      data: updateUserDto,
    });
  }

  @Patch('me/password')
  async changePassword(
    @Body() body: { oldPassword: string; newPassword: string },
    @CurrentUser() user: UserModel,
  ) {
    const result = await this.usersService.changePassword(
      user.id,
      body.oldPassword,
      body.newPassword,
    );
    await this.notificationsService.sendPasswordChangedEmail(user.id);
    return result;
  }

  @Post(':id/feedback')
  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  async sendFeedback(
    @Param('id') id: string,
    @Body() body: { score: number; comment: string },
  ) {
    await this.notificationsService.sendFeedbackEmail(Number(id), body.score, body.comment);
    return { sent: true };
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: UserModel,
  ): Promise<UserModel> {
    if (user.id !== Number(id)) throw new ForbiddenException();

    return this.usersService.remove({ id: Number(id) });
  }
}
