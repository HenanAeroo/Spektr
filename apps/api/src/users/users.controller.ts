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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { User as UserModel } from '../../prisma/generated/prisma/client';
import {
  CommunicationType,
  Role as RoleModel,
} from '../../prisma/generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { Throttle } from '@nestjs/throttler';
import { BulkEmailDto } from './dto/bulk-email.dto';
import { CommunicationsService } from '../communications/communications.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly communicationsService: CommunicationsService,
  ) {}

  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '9',
    @Query('promoId') promoId = undefined,
    @CurrentUser() user: UserModel,
  ) {
    return this.usersService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      promoId ? parseInt(promoId, 10) : undefined,
      user.id,
      user.role,
    );
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
    if (
      currentUser.role !== RoleModel.ADMIN &&
      currentUser.role !== RoleModel.SUPER_ADMIN &&
      currentUser.id !== id
    ) {
      throw new ForbiddenException();
    }
    return this.usersService.findOne({ id });
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
    void this.notificationsService.sendPasswordChangedEmail(user.id);
    return result;
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

  @Post('bulk-email')
  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async bulkEmail(@Body() body: BulkEmailDto, @CurrentUser() user: UserModel) {
    return this.usersService.bulkEmail(body, user.id);
  }

  @Post(':id/feedback')
  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  async sendFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { score: number; comment: string },
    @CurrentUser() user: UserModel,
  ) {
    await this.notificationsService.sendFeedbackEmail(
      id,
      body.score,
      body.comment,
    );

    void this.communicationsService
      .create({
        senderId: user.id,
        recipientId: id,
        type: CommunicationType.FEEDBACK,
        score: body.score,
        body: body.comment,
      })
      .catch(() => null);

    return { sent: true };
  }

  @Post('import')
  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'text/csv',
          'text/plain',
          'application/vnd.ms-excel',
          'application/csv',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Format de fichier non supporté (CSV requis)',
            ),
            false,
          );
        }
      },
    }),
  )
  importStudents(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserModel,
  ) {
    if (!file) throw new BadRequestException('Fichier manquant');
    return this.usersService.importStudentsFromCsv(file, user.id, user.role);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserModel,
  ): Promise<UserModel> {
    if (user.id !== id && user.role !== RoleModel.SUPER_ADMIN) {
      throw new ForbiddenException();
    }

    return this.usersService.remove({ id }, user.id, user.role);
  }
}
