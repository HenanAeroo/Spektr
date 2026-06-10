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
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { User as UserModel } from '../../prisma/generated/prisma/client';
import { Role as RoleModel } from '../../prisma/generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { Throttle } from '@nestjs/throttler';
import { BulkEmailDto } from './dto/bulk-email.dto';

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
  findAll(@Query('page') page = '1', @Query('limit') limit = '9') {
    return this.usersService.findAll(parseInt(page), parseInt(limit));
  }

  @Get('me')
  me(@CurrentUser() user: UserModel): UserModel {
    return user;
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: UserModel,
  ): Promise<UserModel | null> {
    if (currentUser.role !== RoleModel.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException();
    }
    return this.usersService.findOne({ id });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: UserModel,
  ): Promise<UserModel> {
    if (user.id !== id) throw new ForbiddenException();

    return this.usersService.update({
      where: { id },
      data: updateUserDto,
    });
  }

  @Patch('me/password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async changePassword(
    @Body() body: ChangePasswordDto,
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

  @Post('bulk-email')
  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  async bulkEmail(@Body() body: BulkEmailDto) {
    await this.usersService.bulkEmail(body);
  }

  @Post(':id/feedback')
  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  async sendFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { score: number; comment: string },
  ) {
    await this.notificationsService.sendFeedbackEmail(
      id,
      body.score,
      body.comment,
    );
    return { sent: true };
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ): Promise<UserModel> {
    if (user.id !== id) throw new ForbiddenException();

    return this.usersService.remove({ id });
  }
}
