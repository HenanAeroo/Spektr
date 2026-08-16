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
  NotFoundException,
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
import { SendFeedbackDto } from './dto/send-feedback.dto';
import { CommunicationsService } from '../communications/communications.service';
import { PromoAccessService } from '../promos/promo-access.service';
import { isAdmin } from '../auth/roles';

/**
 * REST endpoints for user accounts under `/users`. All routes require a valid
 * JWT; admin-only routes additionally apply {@link RolesGuard}. Cross-user reads
 * and actions are scoped by {@link PromoAccessService}.
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly communicationsService: CommunicationsService,
    private readonly promoAccess: PromoAccessService,
  ) {}

  /**
   * `GET /users` — admin-only paginated user list, scoped to the caller's promos.
   *
   * @param page - 1-based page number (query, default '1').
   * @param limit - Page size (query, default '9').
   * @param promoId - Optional promo filter (query).
   * @param user - The authenticated admin (injected).
   * @returns A page of users with pagination metadata.
   */
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

  /**
   * `GET /users/me` — returns the authenticated user's own profile.
   *
   * @param user - The authenticated user (injected).
   * @returns The current user.
   */
  @Get('me')
  me(@CurrentUser() user: UserModel): UserModel {
    return user;
  }

  /**
   * `GET /users/:id` — reads a user. Self is always allowed; otherwise the caller
   * must be an admin of the target's promo (AC-10).
   *
   * @param id - Target user id (path).
   * @param currentUser - The authenticated user (injected).
   * @throws ForbiddenException When a non-admin reads someone else.
   * @throws NotFoundException When the target user does not exist.
   * @returns The requested user.
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: UserModel,
  ): Promise<UserModel | null> {
    if (currentUser.id === id) {
      return this.usersService.findOne({ id });
    }
    if (!isAdmin(currentUser.role)) {
      throw new ForbiddenException();
    }
    // Admins may only read users within promos they administer (AC-10).
    const target = await this.usersService.findOne({ id });
    if (!target) throw new NotFoundException();
    await this.promoAccess.assertAdministersPromo(currentUser, target.promoId);
    return target;
  }

  /**
   * `PATCH /users/me/password` — changes the caller's password (rate-limited to
   * 5/min) and sends a best-effort "password changed" confirmation email.
   *
   * @param body - Current and new password.
   * @param user - The authenticated user (injected).
   * @returns The service result once the password is rotated.
   */
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

  /**
   * `PATCH /users/:id` — updates a profile. A user may only update their own.
   *
   * @param id - Target user id (path).
   * @param updateUserDto - The fields to update.
   * @param user - The authenticated user (injected).
   * @throws ForbiddenException When updating someone else's profile.
   * @returns The updated user.
   */
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

  /**
   * `POST /users/bulk-email` — admin-only; emails many users at once
   * (rate-limited to 5/min), scoped to the sender's promos.
   *
   * @param body - Subject, body and target user ids.
   * @param user - The authenticated admin (injected).
   * @returns The number of messages sent and failed.
   */
  @Post('bulk-email')
  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async bulkEmail(@Body() body: BulkEmailDto, @CurrentUser() user: UserModel) {
    return this.usersService.bulkEmail(body, user);
  }

  /**
   * `POST /users/:id/feedback` — admin-only; emails a student RE feedback and
   * records it as a Communication. Target must be in a promo the sender
   * administers (AC-07).
   *
   * @param id - Target student id (path).
   * @param body - Feedback score and optional comment.
   * @param user - The authenticated admin (injected).
   * @throws NotFoundException When the target user does not exist.
   * @throws ForbiddenException When the target is out of the sender's scope.
   * @returns `{ sent: true }` once the feedback has been dispatched.
   */
  @Post(':id/feedback')
  @Roles(RoleModel.ADMIN)
  @UseGuards(RolesGuard)
  async sendFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SendFeedbackDto,
    @CurrentUser() user: UserModel,
  ) {
    // Feedback may only target a user within a promo the sender administers (AC-07).
    const target = await this.usersService.findOne({ id });
    if (!target) throw new NotFoundException();
    await this.promoAccess.assertAdministersPromo(user, target.promoId);

    await this.notificationsService.sendFeedbackEmail(
      id,
      body.score,
      body.comment ?? '',
    );

    void this.communicationsService
      .create({
        senderId: user.id,
        recipientId: id,
        type: CommunicationType.FEEDBACK,
        score: body.score,
        body: body.comment ?? '',
      })
      .catch(() => null);

    return { sent: true };
  }

  /**
   * `POST /users/import` — admin-only bulk student import from a CSV upload
   * (rate-limited to 3/min, max 5 MB, CSV mime types only).
   *
   * @param file - The uploaded CSV file (multipart `file`).
   * @param user - The authenticated admin (injected).
   * @throws BadRequestException When the file is missing or the wrong format.
   * @returns Counts of imported/skipped rows plus per-row errors.
   */
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

  /**
   * `DELETE /users/:id` — deletes a user. Allowed for self, or for SUPER_ADMIN
   * on anyone; the service enforces the last-owner safety rule.
   *
   * @param id - Target user id (path).
   * @param user - The authenticated user (injected).
   * @throws ForbiddenException When deleting another user without SUPER_ADMIN.
   * @returns The deleted user.
   */
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
